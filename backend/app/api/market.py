"""
KisanAI Market Prices API
Integrates with data.gov.in Agmarknet API for real mandi prices.
"""
from datetime import datetime, date, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Query, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.schemas import MarketPriceResponse, MarketPriceRecord
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=MarketPriceResponse)
@limiter.limit("20/minute")
async def get_market_prices(
    request: Request,
    commodity: Optional[str] = Query(None, description="Crop/commodity name (e.g. Tomato, Wheat)"),
    state: Optional[str] = Query(None, description="State name"),
    district: Optional[str] = Query(None, description="District name"),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Fetch real mandi market prices from data.gov.in Agmarknet API.
    Returns minimum, maximum, and modal prices per market.
    """
    if not settings.AGMARKNET_API_KEY:
        raise HTTPException(
            status_code=503,
            detail=(
                "Market price data is currently unavailable. "
                "To enable this feature, configure AGMARKNET_API_KEY in your .env file. "
                "Register at https://data.gov.in to get a free API key."
            ),
        )

    params = {
        "api-key": settings.AGMARKNET_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": 0,
    }
    if commodity:
        params["filters[Commodity]"] = commodity
    if state:
        params["filters[State]"] = state
    if district:
        params["filters[District]"] = district

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(settings.AGMARKNET_BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Market data service timeout. Please try again.")
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Market price data is currently unavailable. Please try again later."
        )

    records_raw = data.get("records", [])
    if not records_raw:
        return MarketPriceResponse(
            records=[],
            total=0,
            commodity_searched=commodity,
            state_filter=state,
            last_updated=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        )

    records = []
    for r in records_raw:
        try:
            records.append(MarketPriceRecord(
                commodity=r.get("Commodity", "Unknown"),
                variety=r.get("Variety"),
                market=r.get("Market", "Unknown"),
                district=r.get("District", ""),
                state=r.get("State", ""),
                min_price=float(r.get("Min Price", 0)),
                max_price=float(r.get("Max Price", 0)),
                modal_price=float(r.get("Modal Price", 0)),
                unit="Quintal",
                arrival_date=r.get("Arrival Date", ""),
                source="data.gov.in / Agmarknet",
            ))
        except (ValueError, TypeError):
            continue

    return MarketPriceResponse(
        records=records,
        total=len(records),
        commodity_searched=commodity,
        state_filter=state,
        last_updated=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
