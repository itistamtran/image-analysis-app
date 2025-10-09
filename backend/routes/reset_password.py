import os
from flask import Blueprint, request, jsonify, current_app as app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.security import generate_password_hash
from models import User  
from mailersend import MailerSendClient
import json
import traceback
import requests

reset_bp = Blueprint("reset_bp", __name__)

serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY") or "fallback-secret")

MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@medscanai.net")

ms = MailerSendClient(api_key=MAILERSEND_API_KEY)

# ---------------------------
# Forgot Password Endpoint
# ---------------------------
@reset_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    from extensions import SessionLocal
    session = SessionLocal()
    user = session.query(User).filter_by(email=email).first()

    if not user:
        session.close()
        return jsonify({"message": "If this email exists, a reset link will be sent."}), 200

    token = serializer.dumps(email, salt="password-reset-salt")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password/{token}"

    # Build the email HTML body (reuse your gradient design)
    html_body = f"""
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 40px; color: white;">
      <div style="max-width: 600px; margin: auto; background: linear-gradient(135deg, #004aad, #5de0e6); border-radius: 12px; padding: 40px; text-align: center;">
        <img src="https://www.medscanai.net/logo-MedScanAI.png" alt="MedScanAI" style="width: 100px; margin-bottom: 20px;" />
        <h2 style="margin-bottom: 16px;">Reset Your Password</h2>
        <p style="font-size: 16px; color: #e0f2fe;">Click the button below to reset your password. The link expires in 1 hour.</p>
        <a href="{reset_url}" style="display: inline-block; margin-top: 30px; background: white; color: #004aad; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
        <p style="margin-top: 40px; font-size: 14px; color: #e2e8f0;">If you didn’t request this, you can ignore this email.</p>
        <p style="margin-top: 10px; font-size: 12px; color: #94a3b8;">© 2025 MedScanAI. All rights reserved.</p>
      </div>
    </div>
    """

    payload = {
        "from": {"email": MAIL_FROM, "name": "MedScanAI Team"},
        "to": [{"email": email}],
        "subject": "Reset Your Password - MedScanAI",
        "html": html_body,
        "text": f"Click here to reset your password: {reset_url}"
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
            app.logger.info(f"✅ Password reset email sent to {email}")
        else:
            app.logger.error(f"❌ MailerSend API error {response.status_code}: {response.text}")

    except Exception as e:
        app.logger.error(f"❌ Failed to send password reset email: {e}\n{traceback.format_exc()}")

    finally:
        session.close()

    return jsonify({"message": "Password reset link sent if the email exists."}), 200




# --------------------------
# Reset Password Endpoint
# --------------------------
@reset_bp.route("/auth/reset-password/<token>", methods=["POST"])
def reset_password(token):
    try:
        email = serializer.loads(token, salt="password-reset-salt", max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "The reset link has expired."}), 400
    except BadSignature:
        return jsonify({"error": "Invalid or tampered token."}), 400

    data = request.get_json()
    new_password = data.get("password")

    if not new_password:
        return jsonify({"error": "Password is required"}), 400
    
    from extensions import SessionLocal
    session = SessionLocal()
    user = session.query(User).filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found."}), 404

    user.password = generate_password_hash(new_password)
    session.commit()
    session.close()

    return jsonify({"message": "Password has been reset successfully."}), 200