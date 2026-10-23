"""Regresiones de la auditoría de seguridad (pagos, pedidos y auth de admin)."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.database import get_supabase_client
from app.main import app
from app.services.order_service import OrderService
from app.services.payment_service import MercadoPagoProvider


@pytest.mark.anyio
async def test_mock_payment_endpoint_disabled_with_real_provider():
    """En producción (Mercado Pago real) el simulador no debe poder marcar pedidos como pagados."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider", return_value=MercadoPagoProvider("TEST-x")), \
             patch("app.routers.webhooks.OrderService.mark_order_paid", new_callable=AsyncMock) as mock_mark:
            res = await client.post("/api/webhooks/mock-payment/ORD-2026-00001")
            assert res.status_code == 404
            mock_mark.assert_not_awaited()


def _paid_race_db(order_state, stock, coupon_updates):
    """BD simulada donde el SELECT puede devolver un estado viejo pero el UPDATE condicional es atómico."""
    db = MagicMock()

    def order_select(*_a, **_k):
        q = MagicMock()
        # Ambas llamadas concurrentes leen 'pending' (lectura vieja)
        q.eq.return_value.execute.return_value = MagicMock(data=[dict(order_state, status="pending")])
        return q

    def order_update(payload):
        filters = {}

        def execute():
            if order_state["status"] != filters.get("status"):
                return MagicMock(data=[])
            order_state["status"] = payload["status"]
            return MagicMock(data=[dict(order_state)])

        def eq(col, val):
            filters[col] = val
            return chain

        chain = MagicMock(execute=execute)
        chain.eq = eq
        return chain

    orders = MagicMock()
    orders.select.side_effect = order_select
    orders.update.side_effect = order_update

    coupons = MagicMock()
    coupons.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "c1", "times_used": 0}])
    coupons.update.side_effect = lambda payload: coupon_updates.append(payload) or MagicMock()

    def rpc(_name, params):
        stock["current"] -= params["p_quantity"]
        return MagicMock(execute=lambda: MagicMock(data=True))

    db.table.side_effect = lambda name: {"orders": orders, "coupons": coupons}.get(name, MagicMock())
    db.rpc.side_effect = rpc
    return db


@pytest.mark.anyio
async def test_concurrent_payment_confirmations_decrement_stock_once():
    """Webhook y /pago/exitoso llegan a la vez: el stock y el cupón se cuentan una sola vez."""
    order_state = {
        "id": str(uuid4()),
        "order_number": "ORD-2026-00007",
        "status": "pending",
        "total": 5000.0,
        "coupon_code": "VERANO10",
        "order_items": [{"product_variant_id": str(uuid4()), "quantity": 2}],
    }
    stock = {"current": 10}
    coupon_updates = []
    service = OrderService(db_client=_paid_race_db(order_state, stock, coupon_updates))

    await asyncio.gather(
        service.mark_order_paid("ORD-2026-00007", payment_id="p1"),
        service.mark_order_paid("ORD-2026-00007", payment_id="p1"),
    )

    assert stock["current"] == 8
    assert coupon_updates == [{"times_used": 1}]


@pytest.mark.anyio
async def test_mark_order_paid_rejects_underpayment():
    order_state = {"id": str(uuid4()), "status": "pending", "total": 50000.0, "order_items": []}
    db = _paid_race_db(order_state, {"current": 1}, [])
    service = OrderService(db_client=db)

    with pytest.raises(ValueError, match="no cubre el total"):
        await service.mark_order_paid("ORD-2026-00008", payment_id="p1", payment_details={"transaction_amount": 100})
    assert order_state["status"] == "pending"


@pytest.mark.anyio
async def test_confirm_payment_rejects_payment_without_external_reference():
    """Un pago aprobado de la cuenta que no pertenece a ningún pedido no puede acreditar uno."""
    db = MagicMock()
    db.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "status": "pending", "order_number": "ORD-2026-00009", "total": 50000.0}]
    )
    provider = AsyncMock()
    provider.get_payment_details.return_value = {"status": "approved", "transaction_amount": 100}
    service = OrderService(db_client=db, payment_provider=provider)

    with pytest.raises(ValueError, match="no corresponde a este pedido"):
        await service.confirm_order_payment("ORD-2026-00009", payment_id="pay-ajeno")


@pytest.mark.anyio
async def test_public_order_status_masks_personal_data():
    db = MagicMock()
    db.table().select().eq().execute.return_value = MagicMock(
        data=[{
            "id": str(uuid4()),
            "order_number": "ORD-2026-00010",
            "status": "paid",
            "customer_name": "Romina Diaz",
            "customer_email": "romina.diaz@example.com",
            "shipping_address": "Belgrano 456",
            "shipping_city": "Ramos Mejia",
            "shipping_province": "Buenos Aires",
            "shipping_postal_code": "1704",
            "subtotal": 100.0,
            "total": 100.0,
            "order_items": [],
        }]
    )
    resp = await OrderService(db_client=db).get_order_status("ORD-2026-00010")

    assert resp.customer_name == "Romina"
    assert resp.customer_email == "ro***@example.com"
    assert "456" not in resp.shipping_address


def test_reset_password_wrong_code_invalidates_code():
    """Un código incorrecto borra el código guardado: no se pueden probar los 6 dígitos uno por uno."""
    db = MagicMock()
    db.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": "admin-1", "reset_password_code": "123456", "reset_password_expires_at": None}]
    )
    app.dependency_overrides[get_supabase_client] = lambda: db
    try:
        res = TestClient(app).post(
            "/api/admin/auth/reset-password",
            json={"email": "admin@natbell.com", "code": "000000", "new_password": "NuevaClave123!"},
        )
        assert res.status_code == 400
        db.table().update.assert_any_call({"reset_password_code": None})
    finally:
        app.dependency_overrides.clear()
