from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.anyio
async def test_mercadopago_webhook_invalid_signature():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider") as mock_prov_fn:
            mock_prov = AsyncMock()
            mock_prov.verify_webhook_signature.return_value = False
            mock_prov_fn.return_value = mock_prov

            res = await client.post(
                "/api/webhooks/mercadopago?data.id=123456",
                json={"type": "payment", "data": {"id": "123456"}},
                headers={"x-signature": "ts=123,v1=invalid_signature"},
            )
            assert res.status_code == 401
            assert "inválida" in res.json()["detail"].lower()


@pytest.mark.anyio
async def test_mercadopago_webhook_payment_approved_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider") as mock_prov_fn, \
             patch("app.routers.webhooks.OrderService.mark_order_paid", new_callable=AsyncMock) as mock_mark_paid:
            
            mock_prov = AsyncMock()
            mock_prov.verify_webhook_signature.return_value = True
            mock_prov.get_payment_details.return_value = {
                "id": "123456789",
                "status": "approved",
                "status_detail": "accredited",
                "external_reference": "ORD-2026-00001",
            }
            mock_prov_fn.return_value = mock_prov
            mock_mark_paid.return_value = True

            res = await client.post(
                "/api/webhooks/mercadopago?data.id=123456789",
                json={"type": "payment", "data": {"id": "123456789"}},
                headers={"x-signature": "ts=123,v1=valid"},
            )
            assert res.status_code == 200
            assert res.json()["status"] == "received"
            mock_mark_paid.assert_called_once_with(
                "ORD-2026-00001",
                payment_id="123456789",
                payment_details={
                    "id": "123456789",
                    "status": "approved",
                    "status_detail": "accredited",
                    "external_reference": "ORD-2026-00001",
                },
            )


@pytest.mark.anyio
async def test_mock_payment_simulation_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.OrderService.mark_order_paid", new_callable=AsyncMock) as mock_mark_paid:
            mock_mark_paid.return_value = True

            res = await client.post("/api/webhooks/mock-payment/ORD-2026-00042")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "mock_payment_approved"
            assert data["order_number"] == "ORD-2026-00042"
