import os
import requests
from flask import current_app as app, url_for
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
from utils.mail_config import mail


MAILBOXLAYER_KEY = os.getenv("MAILBOXLAYER_API_KEY")
serializer = URLSafeTimedSerializer(
    os.getenv("SECRET_KEY") or "fallback-secret")


def validate_email(email):
    """Validate email using MailboxLayer (up to 100 free per month)."""
    try:
        res = requests.get("https://apilayer.net/api/check", params={
            "access_key": MAILBOXLAYER_KEY,
            "email": email,
            "smtp": 1,
            "format": 1
        }, timeout=5
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
    return URLSafeTimedSerializer(app.config['SECRET_KEY'])


def send_verification_email(email):
    token = get_serializer(app).dumps(email, salt="email-confirm-salt")

    backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")
    verify_url = f"{backend_url}/verify/{token}"

    msg = Message(
        subject="Verify Your Email - MedScanAI",
        sender=("MedScanAI Team", app.config["MAIL_DEFAULT_SENDER"]),
        recipients=[email],
    )

    msg.html = f"""
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 40px; color: white;">
      <div style="max-width: 600px; margin: auto; background: linear-gradient(135deg, #004aad, #5de0e6); border-radius: 12px; padding: 40px; text-align: center;">
        <img src="https://medscanai.vercel.app/logo-MedScanAI.png" alt="MedScanAI" style="width: 100px; margin-bottom: 20px;" />
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

    with app.app_context():
        mail.send(msg)
