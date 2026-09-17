from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.shipping_service import (
    AndreaniShippingProvider,
    FixedRateProvider,
    extract_numeric_postal_code,
    shipping_service,
)


@pytest.fixture(autouse=True)
def default_fixed_provider():
    original = shipping_service._provider
    shipping_service.set_provider(FixedRateProvider())
    yield
    shipping_service.set_provider(original)


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


def test_andreani_provider_success():
    provider = AndreaniShippingProvider(
        credential_id="fake_cred",
        origin_postal_code="1752",
    )

    mock_login_resp = MagicMock()
    mock_login_resp.status_code = 200
    mock_login_resp.json.return_value = {
        "response": {"accessToken": "fake_token_123"}
    }

    mock_rates_resp = MagicMock()
    mock_rates_resp.status_code = 200
    mock_rates_resp.json.return_value = {
        "response": {
            "rates": [
                {"code": "estándar", "total": 9624.96},
                {"code": "sucursal", "total": 6073.96},
            ]
        }
    }

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.post.side_effect = [mock_login_resp, mock_rates_resp]
        mock_client_cls.return_value = mock_client

        quote = provider.calculate_quote("1414")

        assert quote.provider == "andreani"
        assert quote.cost == Decimal("9624.96")
        assert "Andreani" in quote.zone_name
        assert quote.postal_code == "1414"
        assert quote.estimated_days == 3


def test_andreani_provider_token_caching():
    provider = AndreaniShippingProvider(
        credential_id="fake_cred",
        origin_postal_code="1752",
    )

    mock_login_resp = MagicMock()
    mock_login_resp.status_code = 200
    mock_login_resp.json.return_value = {
        "response": {"accessToken": "fake_token_cached"}
    }

    mock_rates_resp = MagicMock()
    mock_rates_resp.status_code = 200
    mock_rates_resp.json.return_value = {
        "response": {"rates": [{"code": "estándar", "total": 9624.96}]}
    }

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.post.side_effect = [mock_login_resp, mock_rates_resp, mock_rates_resp]
        mock_client_cls.return_value = mock_client

        # Primera llamada: hace login + rates (2 llamadas POST)
        quote1 = provider.calculate_quote("1414")
        assert quote1.provider == "andreani"

        # Segunda llamada: reutiliza token (solo 1 llamada POST a /rates)
        quote2 = provider.calculate_quote("1414")
        assert quote2.provider == "andreani"

        assert mock_client.post.call_count == 3


def test_andreani_provider_fallback_on_network_error():
    provider = AndreaniShippingProvider(
        credential_id="fake_cred",
        origin_postal_code="1752",
    )

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.post.side_effect = Exception("Connection timeout")
        mock_client_cls.return_value = mock_client

        quote = provider.calculate_quote("1414")

        # Debe responder con el fallback (FixedRateProvider)
        assert quote.provider == "fixed_rate"
        assert quote.zone_name == "CABA"
        assert quote.cost == Decimal("3500.00")


def test_andreani_provider_fallback_without_credentials():
    provider = AndreaniShippingProvider(
        credential_id="",
        origin_postal_code="1752",
    )
    quote = provider.calculate_quote("1414")
    assert quote.provider == "fixed_rate"
    assert quote.cost == Decimal("3500.00")


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
