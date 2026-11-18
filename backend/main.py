"""
KisanAI Backend - FastAPI Application Entry Point
"""
import os
import sys
from pathlib import Path

# Ensure the app is importable
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    health, auth, disease, treatment, stores,
    chatbot, weather, market, farmer, history
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

def create_application() -> FastAPI:
    application = FastAPI(
        title="KisanAI API",
        description="AI-Powered Smart Farming Assistant for Indian Farmers",
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Rate limiting
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Static files for uploads
    uploads_dir = Path(settings.UPLOAD_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    application.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    # Register routers
    application.include_router(health.router, prefix="/api", tags=["Health"])
    application.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    application.include_router(disease.router, prefix="/api/disease", tags=["Disease Detection"])
    application.include_router(treatment.router, prefix="/api/treatments", tags=["Treatments"])
    application.include_router(stores.router, prefix="/api/stores", tags=["Store Finder"])
    application.include_router(chatbot.router, prefix="/api/chat", tags=["AI Chatbot"])
    application.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
    application.include_router(market.router, prefix="/api/market-prices", tags=["Market Prices"])
    application.include_router(farmer.router, prefix="/api/farmers", tags=["Farmer"])
    application.include_router(history.router, prefix="/api/history", tags=["History"])

    @application.on_event("startup")
    async def startup_event():
        logger.info("KisanAI API starting up...")
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized.")

    @application.on_event("shutdown")
    async def shutdown_event():
        logger.info("KisanAI API shutting down...")

    return application


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
