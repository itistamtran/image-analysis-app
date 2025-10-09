import os
import requests
from flask import current_app as app, Blueprint, request, jsonify
from itsdangerous import URLSafeTimedSerializer
from mailersend import MailerSendClient
import json
from models import User

verify_bp = Blueprint("verify_bp", __name__)

# Load environment variables
MAILBOXLAYER_KEY = os.getenv("MAILBOXLAYER_API_KEY")
MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@medscanai.net")

# Initialize MailerSend client
ms = MailerSendClient(api_key=MAILERSEND_API_KEY)
serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY") or "fallback-secret")


def validate_email(email):
    """Validate email using MailboxLayer (100 free per month)."""
    try:
        res = requests.get(
            "https://apilayer.net/api/check",
            params={
                "access_key": MAILBOXLAYER_KEY,
                "email": email,
                "smtp": 1,
                "format": 1,
            },
            timeout=5,
        )
        data = res.json()
        if data.get("smtp_check"):
            return True
        app.logger.info(f"Invalid email: {email} — Reason: {data}")
        return False
    except Exception as e:
        app.logger.warning(f"Skipping MailboxLayer validation: {e}")
        return True  # fallback if quota exceeded


def get_serializer(app):
    return URLSafeTimedSerializer(app.config["SECRET_KEY"])


def send_verification_email(email: str) -> None:
    token = get_serializer(app).dumps(email, salt="email-verify-salt")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify/{token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 40px; color: white;">
      <div style="max-width: 600px; margin: auto; background: linear-gradient(135deg, #004aad, #5de0e6); border-radius: 12px; padding: 40px; text-align: center;">
        <img src="https://www.medscanai.net/logo-MedScanAI.png" alt="MedScanAI" style="width: 100px; margin-bottom: 20px;" />
        <h2 style="margin-bottom: 16px;">Welcome to MedScanAI</h2>
        <p style="font-size: 16px; color: #e0f2fe;">Thanks for signing up! Please verify your email to get started.</p>
        <a href="{verify_url}" style="display: inline-block; margin-top: 30px; background: white; color: #004aad; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Verify My Email
        </a>
        <p style="margin-top: 40px; font-size: 14px; color: #e2e8f0;">If you didn’t create an account, you can safely ignore this email.</p>
        <p style="margin-top: 10px; font-size: 12px; color: #94a3b8;">© 2025 MedScanAI. All rights reserved.</p>
      </div>
    </div>
    """

    payload = {
        "from": {"email": MAIL_FROM, "name": "MedScanAI Team"},
        "to": [{"email": email}],
        "subject": "Verify Your Email - MedScanAI",
        "html": html_body,
        "text": f"Verify your email here: {verify_url}"
    }

    try:
        response = requests.post(
            "https://api.mailersend.com/v1/email",
            headers={
                "Authorization": f"Bearer {MAILERSEND_API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps(payload),
            timeout=10,
        )

        if response.status_code in (200, 202):
            app.logger.info(f"✅ Verification email sent to {email} ({response.status_code})")
        else:
            app.logger.error(f"❌ MailerSend API error {response.status_code}: {response.text}")

    except Exception as e:
        app.logger.error(f"❌ Failed to send verification email to {email}: {e}")


@verify_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    from extensions import SessionLocal
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            db.close()
            return jsonify({"error": "User not found"}), 404
        
        if user.verification_status == "VERIFIED":
            db.close()
            return jsonify({"message": "User already verified"}), 200

        token = serializer.dumps(email, salt="email-verify-salt")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend_url}/verify/{token}"

        html_body = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 40px; color: white;">
          <div style="max-width: 600px; margin: auto; background: linear-gradient(135deg, #004aad, #5de0e6); border-radius: 12px; padding: 40px; text-align: center;">
            <img src="https://www.medscanai.net/logo-MedScanAI.png" alt="MedScanAI" style="width: 100px; margin-bottom: 20px;" />
            <h2>Verify Your Email</h2>
            <p>Click the button below to verify your account.</p>
            <a href="{verify_url}" style="display:inline-block;margin-top:20px;background:white;color:#004aad;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify Email</a>
          </div>
        </div>
        """

        payload = {
            "from": {"email": MAIL_FROM, "name": "MedScanAI Team"},
            "to": [{"email": email}],
            "subject": "Verify Your Email - MedScanAI",
            "html": html_body,
            "text": f"Click here to verify your email: {verify_url}",
        }

        requests.post(
            "https://api.mailersend.com/v1/email",
            headers={
                "Authorization": f"Bearer {MAILERSEND_API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps(payload),
        )

        db.close()
        return jsonify({"message": "Verification email resent"}), 200

    except Exception as e:
        db.close()
        app.logger.error(f"Error in resend_verification: {e}")
        return jsonify({"error": "Internal server error"}), 500


@verify_bp.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    try:
        email = serializer.loads(token, salt="email-verify-salt", max_age=3600)

        from extensions import SessionLocal
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            db.close()
            return jsonify({"error": "User not found"}), 404

        user.verification_status = "VERIFIED"
        db.commit()
        db.close()

        app.logger.info(f"✅ {email} verified successfully.")
        return jsonify({"message": "Email verified successfully"}), 200

    except Exception as e:
        app.logger.error(f"❌ Verification failed: {e}")
        return jsonify({"error": str(e)}), 400
