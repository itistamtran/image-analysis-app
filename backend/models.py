from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, TIMESTAMP, Integer, Float, Boolean, VARCHAR
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import enum
import uuid
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

# --- Enums ---


class Role(enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"


class VerificationStatus(enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class LogLevel(enum.Enum):
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"

# --- Models ---


class User(Base):
    __tablename__ = "User"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)   # Works for both patients & doctors
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(Enum("PATIENT", "DOCTOR", "ADMIN",
                  name="role"), nullable=False)

    # Common
    verification_status = Column(
        Enum("PENDING", "VERIFIED", "REJECTED", name="verification_status"),
        default="PENDING"
    )

    # Patient-specific fields
    age = Column(Integer, nullable=True)
    gender = Column(Enum("MALE", "FEMALE", "OTHER",
                    "UNKNOWN", name="gender"), nullable=True)
    medical_history = Column(Text, nullable=True)

    # Doctor-specific fields
    npi_number = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    npi_status = Column(VARCHAR(20), default='PENDING')

    # Relationships
    logs = relationship("Log", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    reports = relationship("Report", back_populates="doctor")


class HospitalDomain(Base):
    __tablename__ = "HospitalDomain"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "Prediction"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result = Column(Text, nullable=False)
    confidence = Column(String, nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    heatmap_url = Column(String, nullable=True)
    guest_upload = Column(Boolean, default=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"))
    user = relationship("User", back_populates="predictions")

    reports = relationship("Report", back_populates="prediction")


class Report(Base):
    __tablename__ = "Report"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notes = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prediction_id = Column(UUID(as_uuid=True), ForeignKey("Prediction.id"))
    prediction = relationship("Prediction", back_populates="reports")

    doctor_id = Column(UUID(as_uuid=True),
                       ForeignKey("User.id"), nullable=True)
    doctor = relationship("User", back_populates="reports",
                          foreign_keys=[doctor_id])

    recommendations = Column(Text, nullable=True)


class Log(Base):
    __tablename__ = "Log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message = Column(Text, nullable=False)
    level = Column(Enum("INFO", "WARN", "ERROR",
                   name="loglevel"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"))
    user = relationship("User", back_populates="logs")
