"""
KisanAI Health Check API
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from app.schemas.schemas import HealthResponse
from app.ml.inference import get_model_status

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check endpoint."""
    model_status = get_model_status()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        database="connected",
        ml_model=model_status.get("status", "unknown"),
        timestamp=datetime.now(timezone.utc),
    )
