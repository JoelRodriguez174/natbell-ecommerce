from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.shipping_service import (
    FixedRateProvider,
    extract_numeric_postal_code,
)


def test_extract_numeric_postal_code_valid():
    assert extract_numeric_postal_code("1414") == 1414
    assert extract_numeric_postal_code("C1414CAB") == 1414
    assert extract_numeric_postal_code("B1602XYZ") == 1602
    assert extract_numeric_postal_code(" 5000 ") == 5000


def test_extract_numeric_postal_code_invalid():
    with pytest.raises(ValueError):
        extract_numeric_postal_code("")
    with pytest.raises(ValueError):
        extract_numeric_postal_code("ABC")
    with pytest.raises(ValueError):
        extract_numeric_postal_code("0500")  # menor a 1000
    with pytest.raises(ValueError):
        extract_numeric_postal_code("123")  # solo 3 dígitos


def test_fixed_rate_provider_caba():
    provider = FixedRateProvider()
    quote = provider.calculate_quote("1414")
    assert quote.zone_name == "CABA"
    assert quote.cost == Decimal("3500.00")
    assert quote.estimated_days == 2
    assert quote.postal_code == "1414"
    assert quote.provider == "fixed_rate"


def test_fixed_rate_provider_gba():
    provider = FixedRateProvider()
    quote = provider.calculate_quote("1602")
    assert "GBA" in quote.zone_name
    assert quote.cost == Decimal("5000.00")
    assert quote.estimated_days == 3


def test_fixed_rate_provider_interior():
    provider = FixedRateProvider()
    quote = provider.calculate_quote("5000")  # Córdoba
    assert "Interior" in quote.zone_name
    assert quote.cost == Decimal("7500.00")
    assert quote.estimated_days == 5


@pytest.mark.asyncio
async def test_endpoint_shipping_quote_caba():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/shipping/quote?postal_code=1414")
        assert response.status_code == 200
        data = response.json()
        assert data["zone_name"] == "CABA"
        assert float(data["cost"]) == 3500.0
        assert data["estimated_days"] == 2
        assert data["postal_code"] == "1414"


@pytest.mark.asyncio
async def test_endpoint_shipping_quote_alphanumeric():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/shipping/quote?postal_code=C1414CAB")
        assert response.status_code == 200
        data = response.json()
        assert data["zone_name"] == "CABA"
        assert data["postal_code"] == "1414"


@pytest.mark.asyncio
async def test_endpoint_shipping_quote_interior():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/shipping/quote?postal_code=5000")
        assert response.status_code == 200
        data = response.json()
        assert "Interior" in data["zone_name"]
        assert float(data["cost"]) == 7500.0


@pytest.mark.asyncio
async def test_endpoint_shipping_quote_invalid_code():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/shipping/quote?postal_code=XYZ")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


@pytest.mark.asyncio
async def test_endpoint_shipping_zones():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/shipping/zones")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
