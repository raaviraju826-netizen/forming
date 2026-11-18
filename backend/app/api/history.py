"""
KisanAI Scan History API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import DiseaseScan, SavedRecommendation

router = APIRouter()


@router.get("")
async def get_scan_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer_id = current_user["sub"]
    offset = (page - 1) * page_size

    result = await db.execute(
        select(DiseaseScan)
        .where(DiseaseScan.farmer_id == farmer_id)
        .order_by(DiseaseScan.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    scans = result.scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "scans": [
            {
                "scan_id": str(s.id),
                "crop_name": s.crop_name,
                "predicted_class": s.predicted_class,
                "confidence_score": s.confidence_score,
                "is_healthy": s.is_healthy,
                "image_url": f"/uploads/{s.image_filename}",
                "created_at": s.created_at,
            }
            for s in scans
        ],
    }


@router.post("/save/{scan_id}")
async def save_recommendation(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer_id = current_user["sub"]

    result = await db.execute(select(DiseaseScan).where(DiseaseScan.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    saved = SavedRecommendation(
        farmer_id=farmer_id,
        scan_id=scan_id,
        title=f"{scan.crop_name or 'Crop'} - {scan.predicted_class or 'Scan'}",
        recommendation_type="disease",
    )
    db.add(saved)
    await db.commit()
    return {"message": "Diagnosis saved successfully.", "id": str(saved.id)}
