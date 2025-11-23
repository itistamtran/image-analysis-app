from flask import Blueprint, request, jsonify
from flask_cors import CORS
from utils.db import get_db_connection

doctor_bp = Blueprint("doctor", __name__)

# GET doctor info
@doctor_bp.route("/<doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    try:
        print(f"✓ GET /doctors/{doctor_id} called")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, specialization, npi_number, verification_status, role
            FROM "User"
            WHERE id = %s
        """, (doctor_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Doctor not found"}), 404

        if row[6] != "DOCTOR":
            return jsonify({"error": "User is not a doctor"}), 403
        
        doctor = {
            "id": str(row[0]),
            "name": row[1],
            "email": row[2],
            "specialization": row[3],
            "npi_number": row[4],
            "verification_status": row[5],
            "role": row[6]
        }
        return jsonify(doctor), 200
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# GET all patients assigned to a doctor
@doctor_bp.route("/<doctor_id>/patients", methods=["GET"])
def get_doctor_patients(doctor_id):
    try:
        print(f"✓ GET /doctors/{doctor_id}/patients called")

        conn = get_db_connection()
        cur = conn.cursor()

        # Ensure doctor exists
        cur.execute('SELECT 1 FROM "User" WHERE id = %s AND role = %s', (doctor_id, "DOCTOR"))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Doctor not found"}), 404

        # Pull data from Patients and join User if linked_user_id exists
        cur.execute("""
            SELECT 
                p.id,
                p.doctor_id,
                p.linked_user_id,
                p.patient_name,
                p.email,
                p.age,
                p.gender,
                p.medical_history,
                p.created_at,
                p.updated_at,
                
                -- Join fields
                u.name AS linked_name,
                u.email AS linked_email,
                u.role AS linked_role
            FROM "Patients" p
            LEFT JOIN "User" u ON p.linked_user_id = u.id
            WHERE p.doctor_id = %s
            ORDER BY p.created_at DESC
        """, (doctor_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        patients = []
        for r in rows:
            patients.append({
                "patient_record_id": str(r[0]),
                "doctor_id": str(r[1]),

                "linked_user_id": str(r[2]) if r[2] else None,

                # Prefer user.name when linked, else fallback
                "name": r[10] if r[10] else r[3],
                "email": r[11] if r[11] else r[4],
                "role": r[12] if r[12] else "UNREGISTERED",  # optional

                "age": r[5],
                "gender": r[6],
                "medical_history": r[7],

                "created_at": r[8].isoformat() if r[8] else None,
                "updated_at": r[9].isoformat() if r[9] else None,
            })

        print(f"✓ Returned {len(patients)} patients")

        return jsonify(patients), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# POST - Add patient
@doctor_bp.route("/<doctor_id>/patients", methods=["POST"])
def add_patient(doctor_id):
    try:
        data = request.get_json()

        if not data.get("patient_name") or not data.get("email"):
            return jsonify({"error": "Patient name and email are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Ensure doctor exists
        cur.execute('SELECT 1 FROM "User" WHERE id = %s AND role = %s', (doctor_id, "DOCTOR"))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Doctor not found"}), 404

        # Check duplicates
        cur.execute("""
            SELECT id FROM "Patients"
            WHERE doctor_id = %s AND email = %s
        """, (doctor_id, data["email"]))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "A patient with this email already exists"}), 409

        cur.execute("""
            INSERT INTO "Patients" (doctor_id, patient_name, email, age, gender, medical_history)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, doctor_id, patient_name, email, age, gender, medical_history, created_at, updated_at
        """, (
            doctor_id,
            data.get("patient_name"),
            data.get("email"),
            data.get("age"),
            data.get("gender"),
            data.get("medical_history")
        ))

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        patient = {
            "id": str(row[0]),
            "doctor_id": str(row[1]),
            "patient_name": row[2],
            "email": row[3],
            "age": row[4],
            "gender": row[5],
            "medical_history": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
            "updated_at": row[8].isoformat() if row[8] else None
        }

        return jsonify(patient), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# PUT - Update
@doctor_bp.route("/<doctor_id>/patients/<patient_id>", methods=["PUT"])
def update_patient(doctor_id, patient_id):
    try:
        data = request.get_json()

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE "Patients"
            SET patient_name = %s, email = %s, age = %s, gender = %s,
                medical_history = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND doctor_id = %s
            RETURNING id, doctor_id, patient_name, email, age, gender, medical_history, created_at, updated_at
        """, (
            data.get("patient_name"),
            data.get("email"),
            data.get("age"),
            data.get("gender"),
            data.get("medical_history"),
            patient_id,
            doctor_id
        ))

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Patient not found"}), 404

        patient = {
            "id": str(row[0]),
            "doctor_id": str(row[1]),
            "patient_name": row[2],
            "email": row[3],
            "age": row[4],
            "gender": row[5],
            "medical_history": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
            "updated_at": row[8].isoformat() if row[8] else None
        }

        return jsonify(patient), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# DELETE
@doctor_bp.route("/<doctor_id>/patients/<patient_id>", methods=["DELETE"])
def delete_patient(doctor_id, patient_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            DELETE FROM "Patients"
            WHERE id = %s AND doctor_id = %s
            RETURNING id
        """, (patient_id, doctor_id))

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Patient not found"}), 404

        return jsonify({"message": "Patient deleted successfully"}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
