"""
KisanAI Application Configuration
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "KisanAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "kisanai-dev-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database — SQLite by default (no install needed), switch to PostgreSQL in production
    DATABASE_URL: str = "sqlite+aiosqlite:///./kisanai.db"
    ASYNC_DATABASE_URL: str = "sqlite+aiosqlite:///./kisanai.db"

    # AI / LLM
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # ML Model
    MODEL_PATH: str = "./app/ml/saved_models/plant_disease_model.h5"
    MODEL_LABELS_PATH: str = "./app/ml/saved_models/class_labels.json"
    CONFIDENCE_THRESHOLD: float = 0.60

    # External APIs
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    AGMARKNET_API_KEY: Optional[str] = None
    AGMARKNET_BASE_URL: str = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [
            self.FRONTEND_URL,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
        ]

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
