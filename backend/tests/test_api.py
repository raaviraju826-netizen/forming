"""
KisanAI Backend API Tests
"""
import pytest
import io
from PIL import Image
from httpx import AsyncClient, ASGITransport


@pytest.fixture
def anyio_backend():
    return "asyncio"


def make_test_image(format="JPEG") -> bytes:
    """Create a valid test image in memory."""
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))  # green image
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.mark.anyio
async def test_health_check():
    import sys
    sys.path.insert(0, ".")
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "ml_model" in data


@pytest.mark.anyio
async def test_disease_predict_no_file():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/disease/predict")
    assert response.status_code == 422  # validation error


@pytest.mark.anyio
async def test_disease_predict_invalid_type():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/disease/predict",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.anyio
async def test_disease_predict_too_small():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/disease/predict",
            files={"file": ("tiny.jpg", b"x" * 100, "image/jpeg")},
        )
    # Either 400 (invalid) or 503 (model not loaded) are acceptable
    assert response.status_code in [400, 503]


@pytest.mark.anyio
async def test_chat_empty_message():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/chat", json={"message": "", "language": "en"})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_chat_invalid_language():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/chat", json={"message": "Hello", "language": "fr"}
        )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_stores_requires_location():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/stores/nearby")
    assert response.status_code == 422  # lat/lon required


@pytest.mark.anyio
async def test_weather_requires_coords():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/weather")
    assert response.status_code == 422


@pytest.mark.anyio
async def test_market_prices_no_key():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/market-prices")
    # 503 when no API key; 200 if key is configured
    assert response.status_code in [200, 503]


@pytest.mark.anyio
async def test_treatment_not_found():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/treatments/99999")
    # 404 when disease not found; 500/503 when DB not configured — both are acceptable in test
    assert response.status_code in [404, 500, 503]


@pytest.mark.anyio
async def test_auth_register_missing_contact():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/register", json={
            "name": "Test Farmer",
            "password": "password123",
            "preferred_language": "en"
        })
    assert response.status_code == 400  # email or phone required


@pytest.mark.anyio
async def test_farmer_dashboard_requires_auth():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/farmers/dashboard")
    assert response.status_code == 401
