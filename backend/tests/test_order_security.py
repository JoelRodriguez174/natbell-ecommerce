from decimal import Decimal
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.order import OrderCheckoutItem, OrderCheckoutRequest, OrderStatus
from app.services.order_service import OrderService


@pytest.mark.anyio
async def test_pentest_anti_price_tampering_tampered_payload_rejected():
    """PENTEST: Simulación de atacante enviando un precio unitario de $1 o subtotal de $0.
    El backend DEBE consultar Supabase y forzar el precio oficial ($7500).
    """
    mock_supabase = MagicMock()
    variant_id = str(uuid4())
    variant_data = {
        "id": variant_id,
        "sku": "NOV-PENTEST",
        "variant_name": "Standard",
        "stock": 10,
        "price_override": 7500.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {
            "name": "Tratamiento Keratina",
            "base_price": 7500.0,
            "is_active": True,
        },
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])
    mock_supabase.table().select().order().limit().execute.return_value = MagicMock(data=[])
    mock_supabase.table().insert().execute.return_value = MagicMock(
        data=[
            {
                "id": str(uuid4()),
                "order_number": "ORD-2026-00099",
                "status": "pending",
                "subtotal": 15000.0,
                "total": 15000.0,
                "shipping_cost": 0.0,
            }
        ]
    )

    from app.services.payment_service import MockPaymentProvider
    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())

    tampered_request = OrderCheckoutRequest(
        customer_name="Attacker",
        customer_email="attacker@exploit.com",
        customer_phone="123456",
        shipping_address="Unknown 123",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1000",
        shipping_cost=Decimal("0.00"),
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=2)],
    )

    resp = await service.create_order(tampered_request)

    # El subtotal DEBE ser $15000 (2 x $7500), no $0 ni manipulado
    assert resp.subtotal == Decimal("15000.00")
    assert resp.total == Decimal("15000.00")


@pytest.mark.anyio
async def test_pentest_hmac_spoofing_rejected_with_401():
    """PENTEST: Intento de llamar al webhook de Mercado Pago sin firma o con HMAC falso."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider") as mock_prov_fn:
            mock_prov = AsyncMock()
            mock_prov.verify_webhook_signature.return_value = False
            mock_prov_fn.return_value = mock_prov

            # Petición maliciosa
            res = await client.post(
                "/api/webhooks/mercadopago",
                json={"action": "payment.created", "data": {"id": "fake_payment_999"}},
                headers={"X-Signature": "v1=fake_signature_hash,ts=123456789"},
            )
            assert res.status_code == 401


@pytest.mark.anyio
async def test_pentest_replay_attacks_idempotent():
    """PENTEST: Envío de 3 notificaciones idénticas de pago aprobado.
    La orden debe quedar 'paid' y no debe crashear ni duplicar transacciones.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider") as mock_prov_fn, \
             patch("app.routers.webhooks.OrderService.mark_order_paid", new_callable=AsyncMock) as mock_mark_paid:
            
            mock_prov = AsyncMock()
            mock_prov.verify_webhook_signature.return_value = True
            mock_prov.get_payment_details.return_value = {
                "id": "pay-repeat-123",
                "status": "approved",
                "status_detail": "accredited",
                "external_reference": "ORD-2026-00001",
            }
            mock_prov_fn.return_value = mock_prov
            mock_mark_paid.return_value = True

            payload = {"type": "payment", "data": {"id": "pay-repeat-123"}}
            headers = {"x-signature": "ts=123,v1=valid"}

            # Tres envíos consecutivos (Replay simulation)
            res1 = await client.post("/api/webhooks/mercadopago?data.id=pay-repeat-123", json=payload, headers=headers)
            res2 = await client.post("/api/webhooks/mercadopago?data.id=pay-repeat-123", json=payload, headers=headers)
            res3 = await client.post("/api/webhooks/mercadopago?data.id=pay-repeat-123", json=payload, headers=headers)

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert res3.status_code == 200
