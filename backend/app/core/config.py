"""
KisanAI Application Configuration
Supports local (SQLite ./kisanai.db) and Vercel (/tmp/kisanai.db) automatically.
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings


def _default_db_url() -> str:
    """Auto-detect Vercel environment and use /tmp for writable SQLite."""
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"):
        return "sqlite+aiosqlite:////tmp/kisanai.db"
    return "sqlite+aiosqlite:///./kisanai.db"


def _default_upload_dir() -> str:
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"):
        return "/tmp/uploads"
    return "./uploads"


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "KisanAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "kisanai-dev-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Database — SQLite auto-paths for local and Vercel
    DATABASE_URL: str = ""
    ASYNC_DATABASE_URL: str = ""

    # AI / LLM
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # ML Model
    MODEL_PATH: str = "./app/ml/saved_models/plant_disease_model.h5"
    MODEL_LABELS_PATH: str = "./app/ml/saved_models/class_labels.json"
    CONFIDENCE_THRESHOLD: float = 0.55

    # External APIs
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    AGMARKNET_API_KEY: Optional[str] = None
    AGMARKNET_BASE_URL: str = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    # CORS — allow all Vercel preview URLs + localhost
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = [
            self.FRONTEND_URL,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
            # Vercel production & preview deployments
            "https://forming.vercel.app",
            "https://*.vercel.app",
        ]
        return origins

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = ""

    def model_post_init(self, __context) -> None:
        """Set dynamic defaults after model initialization."""
        if not self.DATABASE_URL:
            object.__setattr__(self, "DATABASE_URL", _default_db_url())
        if not self.ASYNC_DATABASE_URL:
            object.__setattr__(self, "ASYNC_DATABASE_URL", _default_db_url())
        if not self.UPLOAD_DIR:
            object.__setattr__(self, "UPLOAD_DIR", _default_upload_dir())

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
