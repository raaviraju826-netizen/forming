"""
KisanAI Pydantic Schemas
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ────────────────────────────────────────────────
class FarmerRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    password: str = Field(..., min_length=6)
    preferred_language: str = Field("en", pattern=r"^(en|hi|te)$")
    state: Optional[str] = None
    district: Optional[str] = None

    @field_validator("email", "phone")
    @classmethod
    def at_least_one_contact(cls, v, info):
        return v


class FarmerLogin(BaseModel):
    identifier: str  # email or phone
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer_id: str
    farmer_name: str
    preferred_language: str


class FarmerProfile(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    preferred_language: str
    state: Optional[str]
    district: Optional[str]
    village: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = Field(None, pattern=r"^(en|hi|te)$")
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None


# ─── Disease Detection ────────────────────────────────────
class PredictionResult(BaseModel):
    scan_id: str
    crop_name: str
    disease_name: str
    disease_name_hindi: Optional[str] = None
    disease_name_telugu: Optional[str] = None
    confidence_score: float
    is_healthy: bool
    is_low_confidence: bool
    reliability_note: str
    symptoms: Optional[str] = None
    causes: Optional[str] = None
    prevention: Optional[str] = None
    description: Optional[str] = None
    top_predictions: List[Dict[str, Any]] = []
    image_url: str
    has_treatment: bool = False
    created_at: datetime


class DiseaseScanResponse(BaseModel):
    id: str
    crop_name: Optional[str]
    predicted_class: Optional[str]
    confidence_score: Optional[float]
    is_healthy: bool
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Treatment ────────────────────────────────────────────
class TreatmentItem(BaseModel):
    id: int
    treatment_category: str
    product_name: Optional[str]
    active_ingredient: Optional[str]
    official_dosage: Optional[str]
    application_method: Optional[str]
    safety_instructions: Optional[str]
    pre_harvest_interval_days: Optional[int]
    source_reference: Optional[str]
    verification_date: Optional[str]
    is_verified: bool
    notes: Optional[str]

    class Config:
        from_attributes = True


class TreatmentResponse(BaseModel):
    disease_id: int
    disease_name: str
    crop_name: str
    treatments: List[TreatmentItem]
    disclaimer: str = (
        "These recommendations are for informational purposes only. "
        "Always follow official product labels and consult a qualified "
        "agricultural officer before applying any pesticide or treatment."
    )


# ─── Store Finder ─────────────────────────────────────────
class StoreResult(BaseModel):
    id: Optional[str] = None
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    distance_km: Optional[float] = None
    operating_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    maps_url: Optional[str] = None
    is_verified: bool = False
    stock_note: str = "Contact store to confirm product availability."
    source: str = "google_places"


class StoreSearchResponse(BaseModel):
    stores: List[StoreResult]
    total: int
    location_used: str
    disclaimer: str = (
        "Store listings are sourced from public directories. "
        "KisanAI does not guarantee product availability or store information accuracy. "
        "Always call ahead to confirm stock."
    )


# ─── Chatbot ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field("en", pattern=r"^(en|hi|te)$")
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    scan_context_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    language: str
    conversation_id: str
    session_id: str
    sources: List[str] = []
    disclaimer: Optional[str] = None


class ConversationHistory(BaseModel):
    conversation_id: str
    messages: List[Dict[str, Any]]
    created_at: datetime


# ─── Weather ─────────────────────────────────────────────
class WeatherData(BaseModel):
    location: str
    latitude: float
    longitude: float
    temperature_c: float
    feels_like_c: float
    humidity_percent: float
    wind_speed_kmh: float
    rainfall_mm: float
    weather_code: int
    weather_description: str
    uv_index: Optional[float] = None
    forecast: List[Dict[str, Any]] = []
    farming_advisory: str
    last_updated: datetime
    source: str = "Open-Meteo (open-meteo.com)"


# ─── Market Prices ───────────────────────────────────────
class MarketPriceRecord(BaseModel):
    commodity: str
    variety: Optional[str] = None
    market: str
    district: str
    state: str
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "Quintal"
    arrival_date: str
    source: str


class MarketPriceResponse(BaseModel):
    records: List[MarketPriceRecord]
    total: int
    commodity_searched: Optional[str] = None
    state_filter: Optional[str] = None
    source: str = "Data.gov.in / Agmarknet"
    disclaimer: str = (
        "Market prices are sourced from public government APIs and may have a delay. "
        "Verify with your local mandi before making selling decisions."
    )
    last_updated: Optional[str] = None


# ─── Dashboard ───────────────────────────────────────────
class DashboardStats(BaseModel):
    total_scans: int
    healthy_crops: int
    disease_detected: int
    recent_scans: List[DiseaseScanResponse]
    recent_conversations: int
    saved_recommendations: int


# ─── Health ──────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    ml_model: str
    timestamp: datetime
