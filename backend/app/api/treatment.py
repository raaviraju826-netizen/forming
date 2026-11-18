"""
KisanAI Treatment Recommendation API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from app.core.database import get_db
from app.models.models import Disease, Treatment, Crop
from app.schemas.schemas import TreatmentResponse, TreatmentItem

router = APIRouter()


@router.get("/{disease_id}", response_model=TreatmentResponse)
async def get_treatments(disease_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get verified agricultural treatment information for a specific disease.
    Only returns treatment options supported by agricultural evidence.
    """
    try:
        stmt = (
            select(Disease)
            .options(selectinload(Disease.crop), selectinload(Disease.treatments))
            .where(Disease.id == disease_id)
        )
        result = await db.execute(stmt)
        disease = result.scalar_one_or_none()
    except (DBAPIError, SQLAlchemyError) as e:
        raise HTTPException(
            status_code=503,
            detail="Database is unavailable. Please ensure PostgreSQL is running and configured."
        )

    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found.")

    if disease.is_healthy:
        return TreatmentResponse(
            disease_id=disease_id,
            disease_name=disease.name,
            crop_name=disease.crop.name if disease.crop else "Unknown",
            treatments=[],
            disclaimer=(
                "This crop appears healthy. No treatment is required. "
                "Continue good agricultural practices for prevention."
            ),
        )

    treatment_items = [
        TreatmentItem(
            id=t.id,
            treatment_category=t.treatment_category,
            product_name=t.product_name,
            active_ingredient=t.active_ingredient,
            official_dosage=t.official_dosage,
            application_method=t.application_method,
            safety_instructions=t.safety_instructions,
            pre_harvest_interval_days=t.pre_harvest_interval_days,
            source_reference=t.source_reference,
            verification_date=t.verification_date,
            is_verified=t.is_verified,
            notes=t.notes,
        )
        for t in disease.treatments
    ]

    if not treatment_items:
        return TreatmentResponse(
            disease_id=disease_id,
            disease_name=disease.name,
            crop_name=disease.crop.name if disease.crop else "Unknown",
            treatments=[],
            disclaimer=(
                "Verified treatment information for this disease is currently unavailable in our database. "
                "Please consult your nearest Krishi Vigyan Kendra (KVK) or agricultural officer."
            ),
        )

    return TreatmentResponse(
        disease_id=disease_id,
        disease_name=disease.name,
        crop_name=disease.crop.name if disease.crop else "Unknown",
        treatments=treatment_items,
    )

