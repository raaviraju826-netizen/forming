"""
KisanAI Disease Detection API
"""
import json
import uuid

import os
import aiofiles
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user_optional
from app.models.models import DiseaseScan, Disease, Farmer
from app.schemas.schemas import PredictionResult
from app.ml.inference import predict_disease

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/predict", response_model=PredictionResult)
@limiter.limit("20/minute")
async def predict_crop_disease(
    request: Request,
    file: UploadFile = File(..., description="Leaf image (JPG/PNG, max 10MB)"),
    crop_hint: Optional[str] = Form(None, description="Crop type hint (optional)"),
    session_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    Upload a leaf image and get AI-based disease prediction.
    Returns the predicted disease, confidence score, and agricultural information.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPG or PNG."
        )

    # Read and validate file size
    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
    if len(image_bytes) < 1024:
        raise HTTPException(status_code=400, detail="Image file appears to be empty or corrupt.")

    # Save upload
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    scan_id = uuid.uuid4()
    ext = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"{scan_id}{ext}"
    file_path = upload_dir / filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(image_bytes)

    # Run CV inference
    result = predict_disease(
        image_bytes,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        crop_hint=crop_hint,
    )

    if not result.get("success"):
        scan = DiseaseScan(
            id=str(scan_id),
            image_path=str(file_path),
            image_filename=filename,
            session_id=session_id,
            is_low_confidence=True,
        )
        db.add(scan)
        await db.commit()
        raise HTTPException(
            status_code=422,
            detail=result.get("error", "Could not analyse the image. Please upload a clear leaf photo.")
        )

    # Look up disease info from DB for multilingual names (optional enrichment)
    disease_obj = None
    stmt = select(Disease).where(Disease.model_class_label == result["predicted_class"])
    db_result = await db.execute(stmt)
    disease_obj = db_result.scalar_one_or_none()

    # Save scan record
    farmer_id = current_user.get("sub") if current_user else None

    scan = DiseaseScan(
        id=str(scan_id),
        farmer_id=farmer_id,
        disease_id=disease_obj.id if disease_obj else None,
        image_path=str(file_path),
        image_filename=filename,
        predicted_class=result["predicted_class"],
        confidence_score=result["confidence_score"],
        all_predictions=json.dumps(result["top_predictions"]),
        crop_name=result["crop_name"],
        is_healthy=result["is_healthy"],
        is_low_confidence=result["is_low_confidence"],
        image_quality_score=result["quality_score"],
        session_id=session_id,
    )
    db.add(scan)
    await db.commit()

    image_url = f"/uploads/{filename}"

    # Use inference result for symptoms/causes/prevention (always populated from DISEASE_DB)
    # DB disease_obj enriches with multilingual names if seeded
    return PredictionResult(
        scan_id=str(scan_id),
        crop_name=result["crop_name"],
        disease_name=result["disease_name"],
        disease_name_hindi=disease_obj.name_hindi if disease_obj else None,
        disease_name_telugu=disease_obj.name_telugu if disease_obj else None,
        confidence_score=result["confidence_score"],
        is_healthy=result["is_healthy"],
        is_low_confidence=result["is_low_confidence"],
        reliability_note=result["reliability_note"],
        symptoms=result.get("symptoms") or (disease_obj.symptoms if disease_obj else None),
        causes=result.get("causes") or (disease_obj.causes if disease_obj else None),
        prevention=result.get("prevention") or (disease_obj.prevention if disease_obj else None),
        description=disease_obj.description if disease_obj else None,
        top_predictions=result["top_predictions"],
        image_url=image_url,
        has_treatment=not result["is_healthy"],
        created_at=datetime.now(timezone.utc),
    )



@router.get("/{scan_id}")
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    """Get details of a previous scan."""
    result = await db.execute(
        select(DiseaseScan).where(DiseaseScan.id == scan_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    return {
        "scan_id": str(scan.id),
        "crop_name": scan.crop_name,
        "predicted_class": scan.predicted_class,
        "confidence_score": scan.confidence_score,
        "is_healthy": scan.is_healthy,
        "is_low_confidence": scan.is_low_confidence,
        "top_predictions": scan.all_predictions or [],
        "image_url": f"/uploads/{scan.image_filename}",
        "created_at": scan.created_at,
    }
