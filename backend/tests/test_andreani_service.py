from unittest.mock import MagicMock, patch

import pytest

from app.services.andreani_service import AndreaniService


def test_andreani_service_login_success():
    service = AndreaniService(credential_id="TEST_CREDENTIAL")

    mock_login_resp = MagicMock()
    mock_login_resp.status_code = 200
    mock_login_resp.json.return_value = {
        "response": {"accessToken": "mock-token-xyz"}
    }

    with patch("httpx.Client.post", return_value=mock_login_resp):
        token = service.get_access_token()
        assert token == "mock-token-xyz"
        assert service._access_token == "mock-token-xyz"


def test_andreani_service_login_failure():
    service = AndreaniService(credential_id="TEST_CREDENTIAL")

    mock_login_resp = MagicMock()
    mock_login_resp.status_code = 401
    mock_login_resp.text = "Unauthorized"

    with patch("httpx.Client.post", return_value=mock_login_resp):
        token = service.get_access_token()
        assert token is None


def test_andreani_service_register_shipment_success():
    service = AndreaniService(credential_id="TEST_CREDENTIAL")
    service._access_token = "valid-cached-token"
    service._token_expiry_timestamp = 9999999999.0

    mock_reg_resp = MagicMock()
    mock_reg_resp.status_code = 200
    mock_reg_resp.json.return_value = {
        "response": {
            "numeroDeEnvio": "ANDR123456789",
            "status": "Registered",
        }
    }

    sample_order = {
        "order_number": "ORD-2026-00001",
        "customer_name": "Laura Rodriguez",
        "customer_email": "laura@example.com",
        "customer_phone": "1144556677",
        "shipping_address": "Av. Rivadavia 1234, Piso 2",
        "shipping_city": "CABA",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1414",
        "shipping_cost": 1500,
    }

    with patch("httpx.Client.post", return_value=mock_reg_resp):
        result = service.register_shipment(sample_order)
        assert result["tracking_number"] == "ANDR123456789"
        assert "andreani.com" in result["tracking_url"]
        assert "ANDR123456789" in result["tracking_url"]


def test_andreani_service_register_shipment_without_credentials():
    service = AndreaniService(credential_id="")
    with pytest.raises(ValueError, match="No se encontraron credenciales"):
        service.register_shipment({"order_number": "ORD-1"})
