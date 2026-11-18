"""
KisanAI Agricultural Store Finder API
Uses Google Places API when available; falls back to DB records.
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.models.models import AgriculturalStore
from app.schemas.schemas import StoreSearchResponse, StoreResult

router = APIRouter()

EARTH_RADIUS_KM = 6371.0


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Calculate distance between two coordinates in km."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


async def search_google_places(lat: float, lon: float, radius_m: int = 10000) -> list:
    """Search Google Places API for agricultural stores."""
    if not settings.GOOGLE_PLACES_API_KEY:
        return []

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lon}",
        "radius": radius_m,
        "keyword": "agricultural store pesticides fertilizer seeds krishi",
        "type": "store",
        "key": settings.GOOGLE_PLACES_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        stores = []
        for place in data.get("results", [])[:20]:
            loc = place.get("geometry", {}).get("location", {})
            place_lat = loc.get("lat")
            place_lon = loc.get("lng")
            dist = haversine(lat, lon, place_lat, place_lon) if place_lat and place_lon else None

            maps_url = f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}"
            stores.append(StoreResult(
                id=place.get("place_id"),
                name=place.get("name", "Agricultural Store"),
                address=place.get("vicinity"),
                phone=None,  # Requires Details API call
                distance_km=round(dist, 2) if dist else None,
                operating_hours=None,
                latitude=place_lat,
                longitude=place_lon,
                maps_url=maps_url,
                is_verified=False,
                stock_note="Contact store to confirm product availability.",
                source="google_places",
            ))

        return sorted(stores, key=lambda s: s.distance_km or 999)
    except Exception as e:
        return []


@router.get("/nearby", response_model=StoreSearchResponse)
async def get_nearby_stores(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius_km: float = Query(10.0, ge=1, le=50, description="Search radius in km"),
    db: AsyncSession = Depends(get_db),
):
    """
    Find agricultural input stores near a location.
    Uses Google Places when API key is configured; falls back to database records.
    """
    # Try Google Places first
    stores = await search_google_places(lat, lon, int(radius_km * 1000))

    if not stores:
        # Fall back to DB records
        result = await db.execute(
            select(AgriculturalStore).where(AgriculturalStore.latitude.isnot(None))
        )
        db_stores = result.scalars().all()

        for s in db_stores:
            dist = haversine(lat, lon, s.latitude, s.longitude)
            if dist <= radius_km:
                maps_url = None
                if s.latitude and s.longitude:
                    maps_url = f"https://www.google.com/maps/dir/?api=1&destination={s.latitude},{s.longitude}"
                stores.append(StoreResult(
                    id=str(s.id),
                    name=s.name,
                    address=s.address,
                    phone=s.phone,
                    distance_km=round(dist, 2),
                    operating_hours=s.operating_hours,
                    latitude=s.latitude,
                    longitude=s.longitude,
                    maps_url=maps_url,
                    is_verified=s.is_verified,
                    source="database",
                ))

        stores = sorted(stores, key=lambda s: s.distance_km or 999)

    location_str = f"{lat:.4f}, {lon:.4f}"

    return StoreSearchResponse(
        stores=stores,
        total=len(stores),
        location_used=location_str,
    )


@router.get("/search", response_model=StoreSearchResponse)
async def search_stores(
    q: str = Query(..., min_length=1, description="Search query (product, location, store name)"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Search stores by product name, state, or district."""
    stmt = select(AgriculturalStore)
    if state:
        stmt = stmt.where(AgriculturalStore.state.ilike(f"%{state}%"))
    if district:
        stmt = stmt.where(AgriculturalStore.district.ilike(f"%{district}%"))

    result = await db.execute(stmt.limit(50))
    db_stores = result.scalars().all()

    stores = [
        StoreResult(
            id=str(s.id),
            name=s.name,
            address=s.address,
            phone=s.phone,
            distance_km=None,
            operating_hours=s.operating_hours,
            latitude=s.latitude,
            longitude=s.longitude,
            maps_url=(
                f"https://www.google.com/maps/dir/?api=1&destination={s.latitude},{s.longitude}"
                if s.latitude and s.longitude else None
            ),
            is_verified=s.is_verified,
            source="database",
        )
        for s in db_stores
    ]

    return StoreSearchResponse(
        stores=stores,
        total=len(stores),
        location_used=f"Search: {q}",
    )
