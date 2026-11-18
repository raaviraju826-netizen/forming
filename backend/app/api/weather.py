"""
KisanAI Weather API - Integrates Open-Meteo (free, no key required)
"""
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Query, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.schemas import WeatherData
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
}


def get_farming_advisory(temp_c: float, humidity: float, rainfall_mm: float, weather_code: int) -> str:
    """Generate weather-based farming advisory."""
    advisories = []

    if rainfall_mm > 20:
        advisories.append(
            "Heavy rainfall expected. Postpone pesticide or fertilizer application "
            "as per product label instructions — rain may wash away treatments and affect efficacy."
        )
    elif rainfall_mm > 5:
        advisories.append(
            "Light to moderate rainfall expected. Check product labels before spraying "
            "to ensure adequate drying time after application."
        )

    if temp_c > 38:
        advisories.append(
            "Very high temperature. Consider irrigating crops during cooler parts of the day "
            "(early morning or evening) to reduce heat stress."
        )
    elif temp_c < 10:
        advisories.append(
            "Cold temperature. Protect frost-sensitive crops if temperatures drop further."
        )

    if humidity > 85:
        advisories.append(
            "High humidity may increase risk of fungal diseases. Monitor crops closely "
            "and ensure good field drainage and airflow."
        )

    if weather_code in [95, 96, 99]:
        advisories.append(
            "Thunderstorms forecast. Avoid field operations during storms."
        )

    if not advisories:
        advisories.append(
            "Weather conditions appear suitable for general farming activities. "
            "Always consult local agricultural guidance for crop-specific recommendations."
        )

    return " ".join(advisories)


@router.get("", response_model=WeatherData)
@limiter.limit("30/minute")
async def get_weather(
    request: Request,
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    location_name: str = Query("Your Location", description="Human-readable location name"),
):
    """
    Fetch real-time weather from Open-Meteo API (free, no key required).
    Returns current conditions plus 7-day forecast with farming advisories.
    """
    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "precipitation", "weather_code", "wind_speed_10m", "uv_index",
        ],
        "daily": [
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "precipitation_sum", "wind_speed_10m_max", "uv_index_max",
        ],
        "timezone": "Asia/Kolkata",
        "forecast_days": 7,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Weather service timeout. Please try again.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=503, detail=f"Weather service error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=503, detail="Weather data is currently unavailable.")

    current = data.get("current", {})
    daily = data.get("daily", {})

    temp_c = current.get("temperature_2m", 0)
    humidity = current.get("relative_humidity_2m", 0)
    rainfall = current.get("precipitation", 0)
    wind_speed = current.get("wind_speed_10m", 0)
    weather_code = current.get("weather_code", 0)
    uv_index = current.get("uv_index")

    # Build 7-day forecast
    forecast = []
    dates = daily.get("time", [])
    for i, date in enumerate(dates):
        forecast.append({
            "date": date,
            "weather_code": daily.get("weather_code", [])[i] if i < len(daily.get("weather_code", [])) else 0,
            "description": WMO_CODES.get(daily.get("weather_code", [])[i] if i < len(daily.get("weather_code", [])) else 0, "Unknown"),
            "temp_max_c": daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else None,
            "temp_min_c": daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else None,
            "precipitation_mm": daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else 0,
            "wind_speed_max_kmh": daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else None,
        })

    farming_advisory = get_farming_advisory(temp_c, humidity, rainfall, weather_code)

    return WeatherData(
        location=location_name,
        latitude=lat,
        longitude=lon,
        temperature_c=temp_c,
        feels_like_c=current.get("apparent_temperature", temp_c),
        humidity_percent=humidity,
        wind_speed_kmh=wind_speed,
        rainfall_mm=rainfall,
        weather_code=weather_code,
        weather_description=WMO_CODES.get(weather_code, "Unknown"),
        uv_index=uv_index,
        forecast=forecast,
        farming_advisory=farming_advisory,
        last_updated=datetime.now(timezone.utc),
    )
