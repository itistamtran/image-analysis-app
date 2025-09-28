from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_image
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os
import psycopg2
import bcrypt
import requests
import traceback
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# --- Database connection helper ---
def get_db_connection():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    return conn


# Load service account from Railway environment variable
service_account_info = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT"])
cred = credentials.Certificate(service_account_info)

# Initialize only once
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        user_id = request.form.get("user_id")

        result, confidence, all_probs = predict_image(file.read())
        print("DEBUG PREDICT OUTPUT:", result, type(result), confidence)

        image_url = None

        conn = get_db_connection()
        cur = conn.cursor()

        print("ABOUT TO SAVE:", result, confidence, user_id)

        try:
            cur.execute(
                """
                INSERT INTO "Prediction" (id, result, confidence, image_url, user_id, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, now())
                RETURNING id, created_at
                """,
                (result, confidence, image_url, user_id)
            )
            row = cur.fetchone()
            conn.commit()
            prediction_id, created_at = row

        except Exception as e:
            conn.rollback()
            print("❌ Failed to insert prediction:", e)
            raise
        finally:
            cur.close()
            conn.close()

        # ✅ This return must be inside the main try, not floating
        return jsonify({
            'id': str(prediction_id),
            'result': result,
            'confidence': confidence,
            'probabilities': all_probs,
            'createdAt': created_at.isoformat()
        }), 201

    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
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

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO "Prediction" (id, result, confidence, image_url, user_id, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, now())
            RETURNING id, created_at
            """,
            (result, confidence, image_url, user_id)
        )
        print("SAVING PREDICTION:", result, confidence, user_id)

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Prediction saved",
            "id": str(row[0]),
            "createdAt": row[1]
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
            SELECT id, result, confidence, image_url, created_at
            FROM "Prediction"
            WHERE user_id = %s
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
                "createdAt": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]

        return jsonify({"predictions": predictions}), 200

    except Exception as e:
        app.logger.error(f"Error fetching predictions: {e}")
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

        # password logic: hash only if it's not Google OAuth
        hashed_password = None
        if password and password != "google-oauth":
            hashed_password = bcrypt.hashpw(password.encode(
                "utf-8"), bcrypt.gensalt()).decode("utf-8")

        conn = get_db_connection()
        cur = conn.cursor()

        # default verification status
        verification_status = "VERIFIED" if role == "PATIENT" else "PENDING"

        # handle doctor NPI
        if role == "DOCTOR":
            if not npi_number:
                return jsonify({"error": "Doctors must provide an NPI number"}), 400

            try:
                is_valid, provider_info = verify_npi(npi_number)
                if is_valid:
                    verification_status = "VERIFIED"
                else:
                    verification_status = "PENDING"
                    cur.execute(
                        "INSERT INTO \"Log\" (id, message, level, createdAt) VALUES (gen_random_uuid(), %s, %s, now())",
                        (f"Doctor {email} pending verification. NPI: {npi_number}", "WARN")
                    )
            except Exception as e:
                verification_status = "PENDING"
                cur.execute(
                    "INSERT INTO \"Log\" (id, message, level, createdAt) VALUES (gen_random_uuid(), %s, %s, now())",
                    (f"Doctor {email} NPI check failed: {e}", "ERROR")
                )

        app.logger.info(
            f"Signup data: name={name}, email={email}, role={role}, status={verification_status}, npi={npi_number}"
        )

        try:
            cur.execute(
                """
                INSERT INTO "User" (id, name, email, password, role, verification_status, npi_number)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (name, email, hashed_password, role,
                 verification_status, npi_number)
            )
            user_id = cur.fetchone()[0]
            conn.commit()

            return jsonify({
                "message": "User created",
                "user_id": user_id,
                "verification_status": verification_status
            }), 201

        except Exception as e:
            conn.rollback()
            app.logger.error("DB insert failed", exc_info=True)
            return jsonify({"error": f"DB insert failed: {str(e)}"}), 500

        finally:
            cur.close()
            conn.close()

    except Exception as e:
        app.logger.error(f"Error during signup: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


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
            "verificationStatus": verification_status
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

        # ✅ fix column name (alias to camelCase for frontend compatibility)
        cur.execute(
            'SELECT id, password, role, verification_status AS "verificationStatus" '
            'FROM "User" WHERE email = %s',
            (email,)
        )

        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        user_id, hashed_pw, role, verification_status = row

        if not bcrypt.checkpw(password.encode('utf-8'), hashed_pw.encode('utf-8')):
            return jsonify({"error": "Invalid password"}), 401

        return jsonify({
            "message": "Login successful",
            "user_id": user_id,
            "role": role,
            "verificationStatus": verification_status
        }), 200

    except Exception as e:
        app.logger.error(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


# --- Run the app ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
