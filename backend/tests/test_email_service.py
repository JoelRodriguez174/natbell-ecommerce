from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.email_service import EmailService, get_email_service


@pytest.mark.anyio
async def test_email_service_fallback_mode(capsys):
    """When RESEND_API_KEY is not set, service simulates sending without error."""
    with patch("app.services.email_service.settings.resend_api_key", ""):
        service = EmailService()
        sent = await service.send_verification_email(
            to_email="admin@natbell.com",
            name="Admin Test",
            code="123456",
        )
        assert sent is True
        captured = capsys.readouterr()
        assert "123456" in captured.out
        assert "admin@natbell.com" in captured.out


@pytest.mark.anyio
async def test_email_service_password_reset_fallback(capsys):
    """Fallback mode for password reset email."""
    with patch("app.services.email_service.settings.resend_api_key", ""):
        service = EmailService()
        sent = await service.send_password_reset_email(
            to_email="admin@natbell.com",
            name="Admin Test",
            code="654321",
        )
        assert sent is True
        captured = capsys.readouterr()
        assert "654321" in captured.out


@pytest.mark.anyio
async def test_email_service_resend_api_success():
    """When RESEND_API_KEY is configured, sends POST to Resend API."""
    mock_response = httpx.Response(200, json={"id": "msg_12345"})

    with patch("app.services.email_service.settings.resend_api_key", "re_test_key_123"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        service = EmailService()
        sent = await service.send_verification_email(
            to_email="valeria@natbell.com",
            name="Valeria",
            code="987654",
        )

        assert sent is True
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert "https://api.resend.com/emails" in mock_post.call_args.args[0]
        assert call_kwargs["json"]["to"] == ["valeria@natbell.com"]
        assert "987654" in call_kwargs["json"]["html"]
        assert "Bearer re_test_key_123" in call_kwargs["headers"]["Authorization"]


@pytest.mark.anyio
async def test_email_service_resend_api_error():
    """When Resend API returns error, service handles it and returns False."""
    mock_response = httpx.Response(400, json={"message": "Invalid API Key"})

    with patch("app.services.email_service.settings.resend_api_key", "re_test_invalid"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        service = EmailService()
        sent = await service.send_verification_email(
            to_email="valeria@natbell.com",
            name="Valeria",
            code="987654",
        )

        assert sent is False


def test_get_email_service():
    """get_email_service returns EmailService instance."""
    service = get_email_service()
    assert isinstance(service, EmailService)


@pytest.mark.anyio
async def test_email_service_shipping_notification():
    """Shipping notification email contains tracking number and Andreani link."""
    mock_response = httpx.Response(200, json={"id": "msg_ship_123"})

    with patch("app.services.email_service.settings.resend_api_key", "re_test_key_123"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        service = EmailService()
        sent = await service.send_shipping_notification_email(
            to_email="cliente@gmail.com",
            customer_name="Laura Rodriguez",
            order_number="ORD-2026-00001",
            tracking_number="ANDR999888777",
            tracking_url="https://www.andreani.com/#!/informacionEnvio/ANDR999888777",
        )

        assert sent is True
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert "ANDR999888777" in call_kwargs["json"]["html"]
        assert "https://www.andreani.com/#!/informacionEnvio/ANDR999888777" in call_kwargs["json"]["html"]

