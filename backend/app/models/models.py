"""
KisanAI Database Models - SQLAlchemy ORM
Compatible with both SQLite (dev) and PostgreSQL (production)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String, Text, Float, Integer, Boolean,
    ForeignKey, DateTime, JSON, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    state: Mapped[Optional[str]] = mapped_column(String(50))
    district: Mapped[Optional[str]] = mapped_column(String(50))
    village: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    scans: Mapped[list["DiseaseScan"]] = relationship("DiseaseScan", back_populates="farmer")
    conversations: Mapped[list["ChatConversation"]] = relationship("ChatConversation", back_populates="farmer")
    saved_recommendations: Mapped[list["SavedRecommendation"]] = relationship("SavedRecommendation", back_populates="farmer")


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name_hindi: Mapped[Optional[str]] = mapped_column(String(100))
    name_telugu: Mapped[Optional[str]] = mapped_column(String(100))
    scientific_name: Mapped[Optional[str]] = mapped_column(String(150))
    description: Mapped[Optional[str]] = mapped_column(Text)
    growing_season: Mapped[Optional[str]] = mapped_column(String(100))
    major_states: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    diseases: Mapped[list["Disease"]] = relationship("Disease", back_populates="crop")


class Disease(Base):
    __tablename__ = "diseases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    name_hindi: Mapped[Optional[str]] = mapped_column(String(200))
    name_telugu: Mapped[Optional[str]] = mapped_column(String(200))
    model_class_label: Mapped[str] = mapped_column(String(200), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    symptoms: Mapped[Optional[str]] = mapped_column(Text)
    causes: Mapped[Optional[str]] = mapped_column(Text)
    prevention: Mapped[Optional[str]] = mapped_column(Text)
    severity_level: Mapped[Optional[str]] = mapped_column(String(20))
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    crop: Mapped["Crop"] = relationship("Crop", back_populates="diseases")
    scans: Mapped[list["DiseaseScan"]] = relationship("DiseaseScan", back_populates="disease")
    treatments: Mapped[list["Treatment"]] = relationship("Treatment", back_populates="disease")


class DiseaseScan(Base):
    __tablename__ = "disease_scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    farmer_id: Mapped[Optional[str]] = mapped_column(ForeignKey("farmers.id"), nullable=True)
    disease_id: Mapped[Optional[int]] = mapped_column(ForeignKey("diseases.id"), nullable=True)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    image_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    predicted_class: Mapped[Optional[str]] = mapped_column(String(200))
    confidence_score: Mapped[Optional[float]] = mapped_column(Float)
    all_predictions: Mapped[Optional[str]] = mapped_column(Text)  # JSON stored as text for SQLite
    crop_name: Mapped[Optional[str]] = mapped_column(String(100))
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_low_confidence: Mapped[bool] = mapped_column(Boolean, default=False)
    image_quality_score: Mapped[Optional[float]] = mapped_column(Float)
    session_id: Mapped[Optional[str]] = mapped_column(String(100))
    location_lat: Mapped[Optional[float]] = mapped_column(Float)
    location_lon: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    farmer: Mapped[Optional["Farmer"]] = relationship("Farmer", back_populates="scans")
    disease: Mapped[Optional["Disease"]] = relationship("Disease", back_populates="scans")

    __table_args__ = (
        Index("idx_disease_scans_farmer_id", "farmer_id"),
        Index("idx_disease_scans_created_at", "created_at"),
    )


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    disease_id: Mapped[int] = mapped_column(ForeignKey("diseases.id"), nullable=False)
    treatment_category: Mapped[str] = mapped_column(String(50))
    product_name: Mapped[Optional[str]] = mapped_column(String(200))
    active_ingredient: Mapped[Optional[str]] = mapped_column(String(200))
    approved_crop: Mapped[Optional[str]] = mapped_column(String(100))
    target_disease: Mapped[Optional[str]] = mapped_column(String(200))
    official_dosage: Mapped[Optional[str]] = mapped_column(Text)
    application_method: Mapped[Optional[str]] = mapped_column(Text)
    safety_instructions: Mapped[Optional[str]] = mapped_column(Text)
    pre_harvest_interval_days: Mapped[Optional[int]] = mapped_column(Integer)
    source_reference: Mapped[Optional[str]] = mapped_column(Text)
    verification_date: Mapped[Optional[str]] = mapped_column(String(20))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    disease: Mapped["Disease"] = relationship("Disease", back_populates="treatments")


class AgriculturalStore(Base):
    __tablename__ = "agricultural_stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)
    state: Mapped[Optional[str]] = mapped_column(String(50))
    district: Mapped[Optional[str]] = mapped_column(String(50))
    pin_code: Mapped[Optional[str]] = mapped_column(String(10))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    operating_hours: Mapped[Optional[str]] = mapped_column(String(100))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    google_place_id: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    farmer_id: Mapped[Optional[str]] = mapped_column(ForeignKey("farmers.id"), nullable=True)
    session_id: Mapped[str] = mapped_column(String(100), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    scan_context_id: Mapped[Optional[str]] = mapped_column(ForeignKey("disease_scans.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    farmer: Mapped[Optional["Farmer"]] = relationship("Farmer", back_populates="conversations")
    messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="conversation", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("chat_conversations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    retrieved_context: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation: Mapped["ChatConversation"] = relationship("ChatConversation", back_populates="messages")


class SavedRecommendation(Base):
    __tablename__ = "saved_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    farmer_id: Mapped[str] = mapped_column(ForeignKey("farmers.id"), nullable=False)
    scan_id: Mapped[Optional[str]] = mapped_column(ForeignKey("disease_scans.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    recommendation_type: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="saved_recommendations")
