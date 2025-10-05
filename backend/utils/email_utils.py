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
        "Verify Your Email",
        sender=app.config["MAIL_DEFAULT_SENDER"],
        recipients=[email],
        body=f"Please verify your email by clicking this link: {verify_url}"
    )

    mail.send(msg)
