"""
KisanAI Farmer Profile & Dashboard API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Farmer, DiseaseScan, ChatConversation, SavedRecommendation
from app.schemas.schemas import FarmerProfile, FarmerUpdate, DashboardStats, DiseaseScanResponse

router = APIRouter()


@router.get("/profile", response_model=FarmerProfile)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer_id = current_user["sub"]
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return FarmerProfile(
        id=str(farmer.id), name=farmer.name, email=farmer.email,
        phone=farmer.phone, preferred_language=farmer.preferred_language,
        state=farmer.state, district=farmer.district, village=farmer.village,
        is_active=farmer.is_active, created_at=farmer.created_at,
    )


@router.put("/profile", response_model=FarmerProfile)
async def update_profile(
    update: FarmerUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer_id = current_user["sub"]
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")

    if update.name:               farmer.name = update.name
    if update.preferred_language: farmer.preferred_language = update.preferred_language
    if update.state:              farmer.state = update.state
    if update.district:           farmer.district = update.district
    if update.village:            farmer.village = update.village

    await db.commit()
    return FarmerProfile(
        id=str(farmer.id), name=farmer.name, email=farmer.email,
        phone=farmer.phone, preferred_language=farmer.preferred_language,
        state=farmer.state, district=farmer.district, village=farmer.village,
        is_active=farmer.is_active, created_at=farmer.created_at,
    )


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer_id = current_user["sub"]

    total_scans_result = await db.execute(
        select(func.count(DiseaseScan.id)).where(DiseaseScan.farmer_id == farmer_id)
    )
    total_scans = total_scans_result.scalar() or 0

    healthy_result = await db.execute(
        select(func.count(DiseaseScan.id)).where(
            DiseaseScan.farmer_id == farmer_id,
            DiseaseScan.is_healthy == True
        )
    )
    healthy_count = healthy_result.scalar() or 0

    recent_result = await db.execute(
        select(DiseaseScan)
        .where(DiseaseScan.farmer_id == farmer_id)
        .order_by(DiseaseScan.created_at.desc())
        .limit(5)
    )
    recent_scans = recent_result.scalars().all()

    conv_result = await db.execute(
        select(func.count(ChatConversation.id)).where(ChatConversation.farmer_id == farmer_id)
    )
    conv_count = conv_result.scalar() or 0

    saved_result = await db.execute(
        select(func.count(SavedRecommendation.id)).where(SavedRecommendation.farmer_id == farmer_id)
    )
    saved_count = saved_result.scalar() or 0

    recent_scan_responses = [
        DiseaseScanResponse(
            id=str(s.id),
            crop_name=s.crop_name,
            predicted_class=s.predicted_class,
            confidence_score=s.confidence_score,
            is_healthy=s.is_healthy,
            image_url=f"/uploads/{s.image_filename}",
            created_at=s.created_at,
        )
        for s in recent_scans
    ]

    return DashboardStats(
        total_scans=total_scans,
        healthy_crops=healthy_count,
        disease_detected=total_scans - healthy_count,
        recent_scans=recent_scan_responses,
        recent_conversations=conv_count,
        saved_recommendations=saved_count,
    )
