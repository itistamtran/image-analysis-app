import psycopg2
import os

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