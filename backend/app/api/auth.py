"""
KisanAI Auth API - Farmer Registration and Login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.models.models import Farmer
from app.schemas.schemas import FarmerRegister, TokenResponse, FarmerProfile, FarmerUpdate

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_farmer(data: FarmerRegister, db: AsyncSession = Depends(get_db)):
    """Register a new farmer account."""
    if not data.email and not data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone number is required."
        )

    try:
        # Check for existing account
        conditions = []
        if data.email:
            conditions.append(Farmer.email == data.email)
        if data.phone:
            conditions.append(Farmer.phone == data.phone)

        stmt = select(Farmer).where(or_(*conditions))
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email or phone already exists."
            )

        farmer = Farmer(
            name=data.name.strip(),
            email=data.email.strip() if data.email else None,
            phone=data.phone.strip() if data.phone else None,
            hashed_password=get_password_hash(data.password),
            preferred_language=data.preferred_language or "en",
            state=data.state or None,
            district=data.district or None,
        )
        db.add(farmer)
        await db.flush()    # get the generated ID
        await db.commit()   # persist to DB

        token = create_access_token({"sub": str(farmer.id), "name": farmer.name})
        return TokenResponse(
            access_token=token,
            farmer_id=str(farmer.id),
            farmer_name=farmer.name,
            preferred_language=farmer.preferred_language or "en",
        )

    except HTTPException:
        raise
    except (DBAPIError, SQLAlchemyError) as e:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Database error during registration. Please try again."
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login_farmer(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login with email/phone + password."""
    identifier = form_data.username.strip()

    try:
        stmt = select(Farmer).where(
            or_(Farmer.email == identifier, Farmer.phone == identifier)
        )
        result = await db.execute(stmt)
        farmer = result.scalar_one_or_none()
    except (DBAPIError, SQLAlchemyError):
        raise HTTPException(
            status_code=503,
            detail="Database is unavailable. Please ensure the backend is running correctly."
        )

    if not farmer or not verify_password(form_data.password, farmer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not farmer.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    token = create_access_token({"sub": str(farmer.id), "name": farmer.name})
    return TokenResponse(
        access_token=token,
        farmer_id=str(farmer.id),
        farmer_name=farmer.name,
        preferred_language=farmer.preferred_language or "en",
    )


@router.get("/me", response_model=FarmerProfile)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current farmer profile."""
    farmer_id = current_user.get("sub")
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return FarmerProfile(
        id=str(farmer.id),
        name=farmer.name,
        email=farmer.email,
        phone=farmer.phone,
        preferred_language=farmer.preferred_language,
        state=farmer.state,
        district=farmer.district,
        village=farmer.village,
        is_active=farmer.is_active,
        created_at=farmer.created_at,
    )
