from werkzeug.wrappers import Request, Response
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import firebase_admin
from firebase_admin import storage, credentials, auth as firebase_auth
import uuid
import psycopg2
import bcrypt
import requests
import traceback
import json
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from datetime import datetime
from reportlab.pdfgen import canvas
from io import BytesIO
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from itsdangerous import SignatureExpired, BadSignature
from utils.mail_config import init_mail
from utils.email_utils import validate_email, send_verification_email, get_serializer
from tumor_details import TUMOR_DETAILS
from model import model, processor, device, predict_image, generate_vit_gradcam
from models import Prediction, User, Report, Log
import os
from dotenv import load_dotenv
from threading import Thread

load_dotenv()  # load from .env file

app = Flask(
    __name__,
    static_folder="static",        # relative to backend/
    static_url_path="/static"      # URL path prefix
)

if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(
        os.getenv("FIREBASE_SERVICE_ACCOUNT")))
    firebase_admin.initialize_app(
        cred, {"storageBucket": "medscanai-tam.appspot.com"})

print("✅ Firebase initialized:", firebase_admin.get_app().name)
print("✅ Bucket name:", storage.bucket().name)

ALLOWED_ORIGINS = [
    "http://localhost:5173/",
    "http://127.0.0.1:5173",
    "http://localhost:4173/",
    "http://127.0.0.1:4173",
    "https://medscanai.vercel.app",
]

CORS(
    app,
    origins=ALLOWED_ORIGINS,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    methods=["GET", "PUT", "POST", "DELETE", "OPTIONS"],
)
# ensure CORS headers are present even on errors


@app.after_request
def add_cors_headers(resp):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        resp.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    return resp


# Load database URL
DATABASE_URL = os.getenv("NEON_DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check .env file.")

try:
    engine = create_engine(DATABASE_URL)
    print("Database connected successfully.")
except Exception as e:
    print("Database connection failed:", e)


app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", "dev-secret-key")
init_mail(app)

# Path: backend/static/uploads/mri
UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads", "mri")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Database connection helper ---


def get_db_connection():
    dsn = os.getenv("NEON_DATABASE_URL")
    if not dsn:
        raise ValueError(
            "NEON_DATABASE_URL is not set. Check .env file.")

    # Sanitize in case of old prefix
    if dsn.startswith("postgresql+psycopg2://"):
        dsn = dsn.replace("postgresql+psycopg2://", "postgresql://", 1)
        print("Fixed DSN prefix automatically")

    print("Using DSN:", dsn)  # Debug print
    conn = psycopg2.connect(dsn)
    return conn


# Load service account from Railway environment variable
service_account_info = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT"])
cred = credentials.Certificate(service_account_info)

# Initialize only once
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)


@app.route("/test-cors", methods=["GET", "OPTIONS"])
def test_cors():
    return {"message": "CORS working!"}, 200


@app.route('/predict', methods=['POST'])
def predict():
    try:
        # --- Validate image file ---
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        user_id = request.form.get("user_id")
        guest_upload = not bool(user_id)

        print(f"Received file: {file.filename}")
        print(f"User ID: {user_id if user_id else 'Guest upload'}")

        # --- Save uploaded MRI image ---
        upload_folder = os.path.join(app.root_path, "static", "uploads", "mri")
        os.makedirs(upload_folder, exist_ok=True)

        filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        if not os.path.exists(filepath):
            return jsonify({'error': 'Failed to save file'}), 500

        image_url = f"/static/uploads/mri/{filename}"
        print(f"✅ Saved file at {filepath}")

        # --- Run model prediction (fast) ---
        result, confidence, all_probs = predict_image(
            open(filepath, "rb").read())
        print("🧠 Model result:", result, "| Confidence:", confidence)

        # --- Prepare database connection ---
        conn = get_db_connection()
        cur = conn.cursor()
        prediction_id = uuid.uuid4()
        created_at = datetime.utcnow()

        # --- Tumor detail lookup ---
        result_map = {
            "glioma": "glioma",
            "meningioma": "meningioma",
            "pituitary": "pituitary",
            "no_tumor": "no_tumor",
            "unknown": "unknown",
            "unclear": "unclear"
        }
        detail_key = result_map.get(result.lower(), "unknown")
        detail = TUMOR_DETAILS.get(detail_key, {
            "title": "Unknown", "description": "No details available", "bullets": []
        })

        # --- Insert prediction (without heatmap yet) ---
        cur.execute("""
            INSERT INTO "Prediction" (id, result, confidence, image_url, heatmap_url, user_id, created_at, guest_upload)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (str(prediction_id), result, confidence, image_url, '', str(user_id) if user_id else None, created_at, guest_upload))

        # --- Auto-report ---
        auto_notes = f"{detail['title']}\n\n{detail['description']}\n\n" + \
            "\n".join([f"- {p}" for p in detail["bullets"]])
        report_id = uuid.uuid4()
        cur.execute("""
            INSERT INTO "Report" (id, prediction_id, notes, recommendations, doctor_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(report_id), str(prediction_id), auto_notes, json.dumps([]), None, created_at))

        conn.commit()
        cur.close()
        conn.close()
        print("✅ Prediction + report saved successfully")

        # --- Start Grad-CAM in background thread ---
        def generate_heatmap_async(pred_id, file_path, upload_dir):
            try:
                heatmap_filename = f"{uuid.uuid4().hex}_heatmap.jpg"
                heatmap_save_path = os.path.join(upload_dir, heatmap_filename)
                generate_vit_gradcam(
                    model, file_path, processor, device, save_path=heatmap_save_path)

                if os.path.exists(heatmap_save_path):
                    heatmap_url = f"/static/uploads/mri/{os.path.basename(heatmap_save_path)}"
                    print(f"✅ Grad-CAM done -> {heatmap_url}")

                    conn_bg = get_db_connection()
                    cur_bg = conn_bg.cursor()
                    cur_bg.execute("""
                        UPDATE "Prediction" SET heatmap_url = %s WHERE id = %s
                    """, (heatmap_url, str(pred_id)))
                    conn_bg.commit()
                    cur_bg.close()
                    conn_bg.close()
                else:
                    print("[WARN] Grad-CAM not created.")
            except Exception as e:
                print("[ERROR] Background Grad-CAM failed:", e)
                print(traceback.format_exc())

        Thread(target=generate_heatmap_async, args=(
            prediction_id, filepath, upload_folder), daemon=True).start()

        # --- Respond immediately ---
        return jsonify({
            'id': str(prediction_id),
            'result': result,
            'confidence': confidence,
            'probabilities': all_probs,
            'image_url': image_url,
            'heatmap_url': None,  # will be updated later
            'created_at': created_at.isoformat(),
            'guest_upload': guest_upload
        }), 201

    except Exception as e:
        app.logger.error(
            f"❌ Error during prediction: {e}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route("/predictions", methods=["POST"])
def save_prediction():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        result = data.get("result")
        confidence = data.get("confidence")
        image_url = data.get("image_url")

        if not (user_id and result):
            return jsonify({"error": "Missing required fields"}), 400

        prediction_id = uuid.uuid4()

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO "Prediction" (id, result, confidence, image_url, user_id, created_at)
            VALUES (%s, %s, %s, %s, %s, now())
            RETURNING id, created_at
            """,
            (str(prediction_id), result, confidence, image_url, str(user_id))
        )
        print("SAVING PREDICTION:", result, confidence, user_id)

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Prediction saved",
            "id": str(row[0]),
            "created_at": row[1]
        }), 201

    except Exception as e:
        app.logger.error(f"Error saving prediction: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/predictions/<user_id>", methods=["GET"])
def get_predictions(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, result, confidence, image_url, heatmap_url, created_at
            FROM "Prediction"
            WHERE user_id = %s AND guest_upload = FALSE
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        predictions = [
            {
                "id": str(r[0]),
                "result": r[1],
                "confidence": float(r[2]) if r[2] is not None else None,
                "image_url": r[3],
                "heatmap_url": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]

        return jsonify({"predictions": predictions}), 200

    except Exception as e:
        app.logger.error(f"Error fetching predictions: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/prediction/<prediction_id>", methods=["GET"])
def get_prediction(prediction_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, result, confidence, image_url, heatmap_url, created_at
            FROM "Prediction"
            WHERE id = %s
        """, (prediction_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Prediction not found"}), 404

        return jsonify({
            "id": str(row[0]),
            "result": row[1],
            "confidence": float(row[2]) if row[2] is not None else None,
            "image_url": row[3],
            "heatmap_url": row[4],
            "created_at": row[5].isoformat() if row[5] else None,
        }), 200

    except Exception as e:
        app.logger.error(f"Error fetching prediction: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/predictions/guests", methods=["GET"])
def get_guest_predictions():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, result, confidence, image_url, created_at
            FROM "Prediction"
            WHERE guest_upload = TRUE
            ORDER BY created_at DESC
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        guest_preds = [
            {
                "id": str(r[0]),
                "result": r[1],
                "confidence": float(r[2]) if r[2] is not None else None,
                "image_url": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]

        return jsonify({"guest_predictions": guest_preds}), 200
    except Exception as e:
        app.logger.error(f"Error fetching guest predictions: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/predictions/cleanup/guests", methods=["DELETE"])
def cleanup_guest_predictions():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Select files before deleting (so we can remove them from disk)
        cur.execute(
            """
            SELECT id, image_url, heatmap_url
            FROM "Prediction"
            WHERE guest_upload = TRUE
              AND created_at < NOW() - INTERVAL '7 days'
            """
        )
        rows = cur.fetchall()

        # Delete related reports first
        cur.execute(
            """
            DELETE FROM "Report"
            WHERE prediction_id IN (
                SELECT id FROM "Prediction"
                WHERE guest_upload = TRUE
                  AND created_at < NOW() - INTERVAL '7 days'
            )
            """
        )

        # Delete predictions themselves
        cur.execute(
            """
            DELETE FROM "Prediction"
            WHERE guest_upload = TRUE
              AND created_at < NOW() - INTERVAL '7 days'
            RETURNING id
            """
        )
        deleted = cur.fetchall()

        conn.commit()
        cur.close()
        conn.close()

        # --- Delete files from disk ---
        deleted_count = len(deleted)
        for row in rows:
            image_path = os.path.join(
                app.root_path, row[1].lstrip("/")) if row[1] else None
            heatmap_path = os.path.join(
                app.root_path, row[2].lstrip("/")) if row[2] else None

            for path in [image_path, heatmap_path]:
                try:
                    if path and os.path.exists(path):
                        os.remove(path)
                        print(f"🗑️ Deleted file: {path}")
                except Exception as e:
                    print(f"⚠️ Failed to delete file {path}: {e}")

        return jsonify({
            "message": f"Deleted {deleted_count} old guest predictions",
            "deleted_ids": [str(d[0]) for d in deleted]
        }), 200

    except Exception as e:
        app.logger.error(f"Error cleaning guest predictions: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "").upper()
        npi_number = data.get("npiNumber")

        # basic validation
        if not (name and email and role):
            return jsonify({"error": "Missing fields"}), 400

        if role == "ADMIN":
            return jsonify({"error": "You cannot sign up as an admin"}), 403

        if role not in ["PATIENT", "DOCTOR"]:
            return jsonify({"error": "Invalid role"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid or unreachable email address"}), 400

        # password logic: hash only if it's not Google OAuth
        hashed_password = None
        if password and password != "google-oauth":
            hashed_password = bcrypt.hashpw(password.encode(
                "utf-8"), bcrypt.gensalt()).decode("utf-8")

        conn = get_db_connection()
        cur = conn.cursor()

        # default verification status (all users start as PENDING)
        verification_status = "PENDING"

        # Google signups skip verification
        if password == "google-oauth":
            verification_status = "VERIFIED"

        # Handle doctor NPI check
        if role == "DOCTOR":
            if not npi_number:
                return jsonify({"error": "Doctors must provide an NPI number"}), 400

            try:
                is_valid, provider_info = verify_npi(npi_number)
                if is_valid:
                    npi_status = "VERIFIED"
                else:
                    npi_status = "PENDING"
            except Exception as e:
                npi_status = "PENDING"
                app.logger.warning(f"NPI check failed for {email}: {e}")
        else:
            npi_status = None  # patients don’t need NPI

        app.logger.info(
            f"Signup data: name={name}, email={email}, role={role}, status={verification_status}, npi={npi_number}"
        )

        # Insert into database
        cur.execute(
            """
            INSERT INTO "User" (id, name, email, password, role, verification_status, npi_number, npi_status)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (name, email, hashed_password, role,
             verification_status, npi_number, npi_status)
        )
        user_id = cur.fetchone()[0]
        conn.commit()

        # Send verification email (only if not Google signup)
        if password != "google-oauth":
            send_verification_email(email)

        return jsonify({
            "message": "User created, please verify your email before logging in.",
            "user_id": user_id,
            "verification_status": verification_status
        }), 201

    except Exception as e:
        app.logger.error(f"Signup error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def verify_npi(npi_number):
    url = f"https://npiregistry.cms.hhs.gov/api/?number={npi_number}&version=2.1"
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        return False, None

    data = resp.json()
    if data.get("result_count", 0) > 0:
        provider = data["results"][0]["basic"]
        return True, {
            "first_name": provider.get("first_name"),
            "last_name": provider.get("last_name"),
            "credential": provider.get("credential")
        }
    return False, None


@app.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    session = SessionLocal()
    try:
        s = get_serializer(app)
        email = s.loads(token, salt="email-confirm-salt", max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "Verification link has expired"}), 400
    except BadSignature:
        return jsonify({"error": "Invalid or tampered token"}), 400

    user = session.query(User).filter_by(email=email).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    user.verification_status = "VERIFIED"
    session.commit()
    session.close()

    return (
        "<h2 style='text-align:center; margin-top:20%; font-family:sans-serif;'>✅ Email verified successfully!<br>You can now close this tab and log in.</h2>"
    )


@app.route("/login/google", methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        token = data.get("token")
        if not token:
            return jsonify({"error": "Missing token"}), 400

        # Verify Firebase token
        decoded = firebase_auth.verify_id_token(token)
        email = decoded["email"]
        name = decoded.get("name", "Google User")

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute(
            'SELECT id, role, verification_status FROM "User" WHERE email = %s',
            (email,)
        )
        row = cur.fetchone()

        if not row:
            # create new user with a generated UUID
            cur.execute(
                """
                INSERT INTO "User" (id, name, email, role, verification_status)
                VALUES (gen_random_uuid(), %s, %s, %s, %s)
                RETURNING id
                """,
                (name, email, "PATIENT", "VERIFIED")
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            role = "PATIENT"
            verification_status = "VERIFIED"
        else:
            user_id, role, verification_status = row

        cur.close()
        conn.close()

        return jsonify({
            "message": "Google login successful",
            "user_id": str(user_id),
            "email": email,
            "role": role,
            "verification_status": verification_status
        }), 200

    except Exception as e:
        app.logger.error(f"Google login error: {e}")
        return jsonify({"error": "Invalid Google token"}), 401


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not (email and password):
            return jsonify({"error": "Missing fields"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # include npi_status in SELECT
        cur.execute(
            '''
            SELECT id, name, email, password, role, age, gender, medical_history, 
                   npi_number, specialization, verification_status, npi_status
            FROM "User" 
            WHERE email = %s
            ''',
            (email,)
        )

        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        (
            user_id, name, email, hashed_pw, role, age, gender,
            medical_history, npi_number, specialization,
            verification_status, npi_status
        ) = row

        # Require email verification for all (except Google users)
        if verification_status != "VERIFIED" and password != "google-oauth":
            return jsonify({
                "error": "Please verify your email before logging in.",
                "verification_status": verification_status
            }), 403

        # Enforce NPI verification for doctors
        if role == "DOCTOR" and npi_number and npi_status != "VERIFIED":
            return jsonify({
                "error": "Your NPI number is still pending verification. You cannot access the dashboard yet.",
                "npi_status": npi_status
            }), 403

        # Validate password (skip check for google-oauth)
        if password != "google-oauth":
            if not bcrypt.checkpw(password.encode('utf-8'), hashed_pw.encode('utf-8')):
                return jsonify({"error": "Invalid password"}), 401

        # build profile dict
        profile = {
            "id": str(user_id),
            "name": name,
            "email": email,
            "role": role,
            "verification_status": verification_status,
            "npi_status": npi_status,
            "age": age,
            "gender": gender,
            "medical_history": medical_history,
            "npi_number": npi_number,
            "specialization": specialization
        }

        return jsonify({
            "message": "Login successful",
            "profile": profile
        }), 200

    except Exception as e:
        app.logger.error(f"Login error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route("/users/<user_id>", methods=["PUT"])
def update_user_profile(user_id):
    try:
        data = request.get_json()

        # Only allow editable fields
        fields = ["name", "email", "age", "gender",
                  "medical_history", "specialization", "npi_number", "password"]
        updates = {f: data[f] for f in fields if f in data}

        for f in fields:
            if f in data:
                if f == "password":
                    updates[f] = generate_password_hash(
                        data[f])  # hash password
                else:
                    updates[f] = data[f]

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values())
        values.append(user_id)

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            f"""
    UPDATE "User"
    SET {set_clause}
    WHERE id = %s
    RETURNING id, name, email, age, gender, medical_history, specialization, npi_number, role, verification_status
    """,
            values
        )

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": str(row[0]),
            "name": row[1],
            "email": row[2],
            "age": row[3],
            "gender": row[4],
            "medical_history": row[5],
            "specialization": row[6],
            "npi_number": row[7],
            "role": row[8],
            "verification_status": row[9]
        }), 200

    except Exception as e:
        app.logger.error(
            f"Error updating profile: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/users/<user_id>/password", methods=["PUT"])
def update_password(user_id):
    try:
        data = request.get_json()
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            return jsonify({"error": "Current and new password required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Fetch stored password hash
        cur.execute('SELECT password FROM "User" WHERE id = %s', (user_id,))
        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        stored_password = row[0]

        # Verify current password
        if not check_password_hash(stored_password, current_password):
            cur.close()
            conn.close()
            return jsonify({"error": "Incorrect current password"}), 403

        # Hash new password
        new_hashed_password = generate_password_hash(new_password)

        # Update DB
        cur.execute(
            'UPDATE "User" SET password = %s WHERE id = %s',
            (new_hashed_password, user_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        app.logger.error(
            f"Error updating password: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/users/<user_id>", methods=["GET"])
def get_user(user_id):
    try:
        app.logger.info(f"GET /users/{user_id} called")  # log incoming ID
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
    SELECT id, name, email, age, gender, medical_history, specialization, npi_number, role, verification_status
    FROM "User"
    WHERE id = %s
    """,
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            app.logger.warning(f"User not found: {user_id}")
            return jsonify({"error": "User not found"}), 404

        app.logger.info(f"Returning user: {row}")
        return jsonify({
            "id": str(row[0]),
            "name": row[1],
            "email": row[2],
            "age": row[3],
            "gender": row[4],
            "medical_history": row[5],
            "specialization": row[6],
            "npi_number": row[7],
            "role": row[8],
            "verification_status": row[9]
        }), 200

    except Exception as e:
        app.logger.error(f"Error fetching user: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/reports", methods=["POST"])
def create_or_update_report():
    session = SessionLocal()
    try:
        data = request.get_json()
        print("Incoming report payload:", data)

        # --- Validate prediction_id ---
        prediction_id_raw = data.get(
            "prediction_id") or data.get("predictionId")
        if not prediction_id_raw:
            return jsonify({"error": "prediction_id is required"}), 400

        try:
            prediction_id = uuid.UUID(prediction_id_raw)
        except Exception:
            return jsonify({"error": f"Invalid prediction_id: {prediction_id_raw}"}), 400

        # Check prediction exists
        scan = session.query(Prediction).filter_by(id=prediction_id).first()
        if not scan:
            return jsonify({"error": "Prediction not found"}), 404

        # --- Doctor ID (optional) ---
        doctor_id_raw = data.get("doctor_id") or data.get("doctorId")
        doctor_id = None
        if doctor_id_raw:
            try:
                doctor_id = uuid.UUID(doctor_id_raw)
            except Exception:
                return jsonify({"error": f"Invalid doctor_id: {doctor_id_raw}"}), 400

        # --- Fields ---
        notes = data.get("notes", "")
        recs = data.get("recommendations", [])
        if not isinstance(recs, list):
            return jsonify({"error": "recommendations must be a list"}), 400
        recommendations = json.dumps(recs)

        # --- Check if report already exists for this prediction ---
        existing_report = session.query(Report).filter_by(
            prediction_id=prediction_id).first()

        if existing_report:
            # Update existing report
            existing_report.notes = notes
            existing_report.recommendations = recommendations
            existing_report.doctor_id = doctor_id
            session.commit()
            print(
                f"Report updated: {existing_report.id} for prediction {prediction_id}")
            return jsonify({"message": "Report updated", "id": str(existing_report.id)}), 200
        else:
            # Create new report
            new_report = Report(
                prediction_id=prediction_id,
                notes=notes,
                recommendations=recommendations,
                doctor_id=doctor_id
            )
            session.add(new_report)
            session.commit()
            print(
                f"Report created: {new_report.id} for prediction {prediction_id}")
            return jsonify({"message": "Report created", "id": str(new_report.id)}), 201

    except Exception as e:
        session.rollback()
        print("Error creating/updating report:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/report/<uuid:scan_id>", methods=["GET"])
def generate_report(scan_id):
    session = SessionLocal()
    try:
        scan = session.query(Prediction).filter_by(id=scan_id).first()
        if not scan:
            return jsonify({"error": "Scan not found"}), 404

        user = session.query(User).filter_by(id=scan.user_id).first()
        report = session.query(Report).filter_by(prediction_id=scan.id).first()

        if not report:
            return jsonify({"error": "No report for this scan"}), 404

        summary_text = report.notes
        recs = json.loads(
            report.recommendations) if report.recommendations else []

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        y = height - 50
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Report for Scan ID: {scan.id}")

        y -= 25
        p.setFont("Helvetica", 12)
        p.drawString(
            50, y, f"User: {user.name if user else 'Unknown'} | Email: {user.email if user else 'Unknown'}")

        y -= 25
        p.drawString(
            50, y, f"Date: {scan.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

        y -= 25
        p.drawString(50, y, f"Final Prediction: {scan.result}")

        y -= 25
        conf = f"{float(scan.confidence)*100:.2f}%" if scan.confidence else "N/A"
        p.drawString(50, y, f"Confidence Score: {conf}")

        # --- Embed MRI + Heatmap if available ---
        try:
            # MRI
            if scan.image_url:
                image_path = os.path.join(
                    app.root_path, scan.image_url.lstrip("/"))
                image_path = os.path.abspath(image_path)
                print("MRI path in report:", image_path)
                if os.path.exists(image_path):
                    p.drawImage(image_path, 50, 400, width=200,
                                height=200, preserveAspectRatio=True)
                else:
                    print("MRI not found at", image_path)
                    p.setFont("Helvetica", 10)
                    p.drawString(50, 300, "[MRI image missing]")

            # Heatmap
            if scan.heatmap_url:
                heatmap_path = os.path.join(
                    app.root_path, scan.heatmap_url.lstrip("/"))
                heatmap_path = os.path.abspath(heatmap_path)
                print("Heatmap path in report:", heatmap_path)
                if os.path.exists(heatmap_path):
                    p.drawImage(heatmap_path, 300, 400, width=200,
                                height=200, preserveAspectRatio=True)
                else:
                    print("Heatmap not found at", heatmap_path)
                    p.setFont("Helvetica", 10)
                    p.drawString(300, 300, "[Heatmap not available]")

        except Exception as e:
            print("Could not embed MRI/heatmap in PDF:", e)
            p.setFont("Helvetica", 10)
            p.drawString(50, 280, "[Error embedding images in report]")

        # Summary
        y -= 300
        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Summary Report")
        y -= 25
        p.setFont("Helvetica", 12)
        text = p.beginText(50, y)
        text.textLines(summary_text)
        p.drawText(text)

        # Recommendations
        y -= 120
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Recommendations:")
        y -= 20
        p.setFont("Helvetica", 12)
        for rec in recs:
            p.drawString(70, y, f"• {rec}")
            y -= 20

        p.showPage()
        p.save()
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"scan_{scan.id}_report.pdf",
            mimetype="application/pdf"
        )
    finally:
        session.close()


@app.route("/predictions/<prediction_id>", methods=["DELETE"])
def delete_prediction(prediction_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Delete report(s) linked to this prediction first
        cur.execute('DELETE FROM "Report" WHERE prediction_id = %s',
                    (prediction_id,))

        # Delete prediction itself
        cur.execute(
            'DELETE FROM "Prediction" WHERE id = %s RETURNING id', (prediction_id,))
        deleted = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        if not deleted:
            return jsonify({"error": "Prediction not found"}), 404

        return jsonify({"message": "Prediction deleted successfully", "id": prediction_id}), 200

    except Exception as e:
        app.logger.error(f"Error deleting prediction: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/test-firebase", methods=["GET"])
def test_firebase():
    import os
    import json
    import firebase_admin
    from firebase_admin import credentials, storage

    try:
        if not firebase_admin._apps:
            firebase_key_data = os.getenv("FIREBASE_SERVICE_ACCOUNT")
            if not firebase_key_data:
                return jsonify({"error": "FIREBASE_SERVICE_ACCOUNT not set"}), 500

            cred_dict = json.loads(firebase_key_data)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {
                "storageBucket": "medscanai-tam.appspot.com"
            })

        bucket = storage.bucket()
        return jsonify({
            "status": "✅ Firebase connected successfully!",
            "bucket": bucket.name
        }), 200

    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


# --- Run the app ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
