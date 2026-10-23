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


def _paid_race_db(order_state, stock, coupon_updates, stale_read=True, payment_rows=()):
    """BD simulada donde el SELECT puede devolver un estado viejo pero el UPDATE condicional es atómico."""
    db = MagicMock()

    def order_select(*_a, **_k):
        q = MagicMock()
        # stale_read: ambas llamadas concurrentes leen 'pending' aunque otra ya lo haya cambiado
        row = dict(order_state, status="pending") if stale_read else dict(order_state)
        q.eq.return_value.execute.return_value = MagicMock(data=[row])
        return q

    def order_update(payload):
        filters = {}

        def execute():
            allowed = filters.get("status")
            if order_state["status"] not in (allowed if isinstance(allowed, list) else [allowed]):
                return MagicMock(data=[])
            order_state["status"] = payload["status"]
            return MagicMock(data=[dict(order_state)])

        def eq(col, val):
            filters[col] = val
            return chain

        chain = MagicMock(execute=execute)
        chain.eq = eq
        chain.in_ = eq
        return chain

    orders = MagicMock()
    orders.select.side_effect = order_select
    orders.update.side_effect = order_update

    coupons = MagicMock()
    coupons.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "c1", "times_used": 0}])
    coupons.update.side_effect = lambda payload: coupon_updates.append(payload) or MagicMock()

    payments = MagicMock()
    payments.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=list(payment_rows)
    )

    def rpc(name, params):
        if name == "decrement_stock":
            stock["current"] -= params["p_quantity"]
        elif name == "increment_coupon_usage":
            coupon_updates.append(params["p_code"])
        return MagicMock(execute=lambda: MagicMock(data=True))

    db.table.side_effect = lambda name: {"orders": orders, "coupons": coupons, "payments": payments}.get(
        name, MagicMock()
    )
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
    assert coupon_updates == ["VERANO10"]


def _order(status):
    return {
        "id": str(uuid4()),
        "status": status,
        "total": 5000.0,
        "order_items": [{"product_variant_id": str(uuid4()), "quantity": 1}],
    }


@pytest.mark.anyio
async def test_late_payment_reactivates_abandoned_order():
    """Rapipago/Pago Fácil: el pedido se canceló por abandono y el pago llega días después."""
    order_state = _order("cancelled")
    stock = {"current": 5}
    service = OrderService(db_client=_paid_race_db(order_state, stock, [], stale_read=False))

    await service.mark_order_paid("ORD-2026-00020", payment_id="p-tarde")

    assert order_state["status"] == "paid"
    assert stock["current"] == 4


@pytest.mark.anyio
async def test_admin_cancelled_paid_order_is_not_reactivated_by_duplicate_webhook():
    """Si el pedido ya tenía un pago (y el admin lo canceló, ej. reembolso), un aviso repetido no lo revive."""
    order_state = _order("cancelled")
    stock = {"current": 5}
    db = _paid_race_db(order_state, stock, [], stale_read=False, payment_rows=[{"id": "pay-1"}])

    await OrderService(db_client=db).mark_order_paid("ORD-2026-00021", payment_id="p1")

    assert order_state["status"] == "cancelled"
    assert stock["current"] == 5


def test_coupon_usage_falls_back_when_rpc_missing():
    """Si la migración 012 no está aplicada, el contador se sigue sumando con el método anterior."""
    from app.services.coupon_service import CouponService

    db = MagicMock()
    db.rpc.side_effect = Exception("function increment_coupon_usage does not exist")
    db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "c1", "times_used": 3}]
    )
    CouponService(db_client=db).increment_coupon_usage(" verano10 ")

    db.table.return_value.update.assert_called_once_with({"times_used": 4})


@pytest.mark.anyio
async def test_shipping_email_escapes_customer_name():
    from app.services.email_service import EmailService

    service = EmailService()
    with patch.object(service, "_dispatch_email", new_callable=AsyncMock) as mock_dispatch:
        await service.send_shipping_notification_email(
            "c@example.com", '<img src=x onerror="alert(1)">', "ORD-1", "TRK1", "https://andreani.com/x"
        )
    html = mock_dispatch.call_args.args[2]
    assert "<img src=x" not in html
    assert "&lt;img" in html


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


@pytest.mark.anyio
async def test_reimport_with_empty_stock_cell_keeps_real_stock():
    """Re-importar una planilla sin stock no debe pisar el stock real de un SKU existente con 10."""
    from app.services.admin_import_service import AdminImportService

    db = MagicMock()
    products = MagicMock()
    products.select.return_value.ilike.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "prod-1"}]
    )
    variants = MagicMock()
    variants.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "var-1", "stock": 37}]
    )
    db.table.side_effect = lambda name: {"products": products, "product_variants": variants}.get(name, MagicMock())

    csv_bytes = "nombre,precio_base,sku_variante,stock_variante\nShampoo 100% Natural,1000,SKU-1,\n".encode()
    await AdminImportService(db).import_from_bytes(csv_bytes, "productos.csv")

    update_payload = variants.update.call_args.args[0]
    assert "stock" not in update_payload
    # % del nombre escapado: busca ese producto exacto, no "Shampoo 100<cualquier cosa>"
    assert products.select.return_value.ilike.call_args.args[1] == r"Shampoo 100\% Natural"
