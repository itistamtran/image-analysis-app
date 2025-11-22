import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from utils.db import get_db_connection
from model import predict_image_with_heatmap, model, processor, device, generate_vit_gradcam

patient_bp = Blueprint("patient", __name__)

UPLOAD_DIR = os.path.join(os.getcwd(), "static", "uploads", "mri")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================
# GET PATIENT SCANS
# ============================
@patient_bp.get("/patients/<patient_id>/scans")
def get_patient_scans(patient_id):
    print("📌 GET /patients/.../scans", patient_id)

    conn = get_db_connection()
    cur = conn.cursor()

    # Ensure patient exists
    cur.execute('SELECT id FROM "Patients" WHERE id = %s', (patient_id,))
    if not cur.fetchone():
        return jsonify({"error": "Patient not found"}), 404

    cur.execute("""
        SELECT 
            ps.id AS patient_scan_id,
            p.id AS prediction_id,
            p.result,
            p.confidence,
            p.image_url,
            p.heatmap_url,
            p.created_at
        FROM "PatientScan" ps
        JOIN "Prediction" p ON p.id = ps.prediction_id
        WHERE ps.patient_id = %s
        ORDER BY p.created_at DESC
    """, (patient_id,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "scan_id": str(r[0]),          # PatientScan.id
            "prediction_id": str(r[1]),    # Prediction.id (use this in detail page)
            "result": r[2],
            "confidence": float(r[3]) if r[3] else 0,
            "image_url": r[4],
            "heatmap_url": r[5],
            "created_at": r[6].isoformat(),
        }
        for r in rows
    ]), 200


# ============================
# UPLOAD & PREDICT FOR PATIENT
# ============================
@patient_bp.post("/patients/<patient_id>/upload_scan")
def upload_scan_for_patient(patient_id):
    print("📌 POST /patients/.../upload_scan", patient_id)

    conn = get_db_connection()
    cur = conn.cursor()

    # Ensure patient exists
    cur.execute('SELECT id FROM "Patients" WHERE id = %s', (patient_id,))
    if not cur.fetchone():
        return jsonify({"error": "Patient not found"}), 404

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files["image"]
    bytes_data = file.read()

    # Predict
    result, confidence, heatmap_img = predict_image_with_heatmap(bytes_data)

    # Save image_url
    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(bytes_data)

    image_url = f"/static/uploads/mri/{filename}"

    # Save heatmap_url
    heatmap_url = None
    if heatmap_img is not None:
        heatmap_filename = f"{uuid.uuid4().hex}_heatmap.png"
        heatmap_path = os.path.join(UPLOAD_DIR, heatmap_filename)
        heatmap_img.save(heatmap_path)
        heatmap_url = f"/static/uploads/mri/{heatmap_filename}"

        print("🔥 Heatmap saved:", heatmap_url)
    else:
        print("❌ No heatmap created")

    # Save prediction
    prediction_id = uuid.uuid4()
    created_at = datetime.utcnow()

    cur.execute("""
        INSERT INTO "Prediction" (id, result, confidence, image_url, heatmap_url, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (str(prediction_id), result, confidence, image_url, heatmap_url, created_at))


    scan_id = uuid.uuid4()
    cur.execute("""
        INSERT INTO "PatientScan" (id, patient_id, prediction_id, created_at)
        VALUES (%s, %s, %s, %s)
    """, (str(scan_id), patient_id, str(prediction_id), created_at))

    conn.commit()
    cur.close()
    conn.close()

    

    return jsonify({
        "message": "Scan uploaded",
        "result": result,
        "confidence": confidence,
        "image_url": image_url,
        "heatmap_url": heatmap_path
    }), 201


@patient_bp.get("/patients/<user_id>/assigned")
def get_assigned_doctor(user_id):
    try:
        print(f"✓ GET /patients/{user_id}/assigned called")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT patient_name, doctor_id, email, gender, age, medical_history
            FROM patients
            WHERE linked_user_id = %s
        """, (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            print(f"✗ No assigned doctor for user: {user_id}")
            return jsonify({}), 200

        result = {
            "patient_name": row[0],
            "doctor_id": str(row[1]),
            "email": row[2],
            "gender": row[3],
            "age": row[4],
            "medical_history": row[5]
        }
        print(f"✓ Returning assigned doctor info")
        return jsonify(result), 200

    except Exception as e:
        print(f"✗ Error fetching assigned doctor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    
@patient_bp.get("/patients/scan/<scan_id>")
def get_scan(scan_id):
    print(f"📌 GET /patients/scan/{scan_id}")
    conn = get_db_connection()
    cur = conn.cursor()

    # First, try to find the scan in PatientScan table and join with Prediction
    cur.execute("""
    SELECT 
        ps.id AS scan_id,
        p.id AS prediction_id,
        p.result,
        p.confidence,
        p.image_url,
        p.heatmap_url,
        p.created_at
    FROM "PatientScan" ps
    JOIN "Prediction" p ON p.id = ps.prediction_id
    WHERE ps.id = %s
    """, (scan_id,))

    
    row = cur.fetchone()
    
    # If not found, try looking directly in Prediction table
    if not row:
        print(f"📌 Not found in PatientScan, trying Prediction table directly")
        cur.execute("""
            SELECT id, result, confidence, image_url, heatmap_url, created_at, id
            FROM "Prediction"
            WHERE id = %s
        """, (scan_id,))
        row = cur.fetchone()
    
    cur.close()
    conn.close()

    if not row:
        print(f"✗ Scan not found: {scan_id}")
        return jsonify({"error": "Scan not found"}), 404

    print(f"✓ Scan found: {row}")
    return jsonify({
        "id": str(row[0]),
        "result": row[2],
        "confidence": float(row[3]) if row[3] else 0,
        "image_url": row[4],
        "heatmap_url": row[5], 
        "created_at": row[6].isoformat() if row[6] else None
}), 200