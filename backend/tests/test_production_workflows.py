"""Suite integral de verificación y certificación de flujos críticos de producción (Natbell).

Cubre los 6 flujos de punta a punta:
1. Carrera concurrente y stock agotado en tiempo real (evita sobreventa y pedidos huérfanos).
2. Aceptación de pago, acreditación atómica de stock e idempotencia de Webhook HMAC.
3. Anti-spoofing en retorno de pago (/confirm-payment con validación de external_reference).
4. Rechazo de pago, cancelación y limpieza segura de borrador (DELETE /draft).
5. Anti-tampering de precios, costos de envío negativos y productos inactivos.
6. Tracking público de pedidos con trazabilidad Andreani y ciclo admin de despacho.
"""

import asyncio
from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.order import (
    OrderCheckoutItem,
    OrderCheckoutRequest,
    OrderStatus,
)
from app.services.order_service import OrderService
from app.services.payment_service import MockPaymentProvider

# ==============================================================================
# FLUJO 1: Stock Agotado en Tiempo Real y Carrera Concurrente (Anti-Overselling)
# ==============================================================================

@pytest.mark.anyio
async def test_flow_1_stock_depleted_mid_session_rejects_cleanly():
    """Escenario: El usuario añade un producto que tenía 1 unidad al carrito.
    Antes de finalizar la compra, el stock cae a 0 (comprado por otro cliente).
    El sistema debe rechazar el intento con HTTP 400, mensaje claro y sin persistir la orden.
    """
    variant_id = str(uuid4())
    mock_supabase = MagicMock()

    # La consulta a BD devuelve stock = 0
    variant_data = {
        "id": variant_id,
        "sku": "NOV-PROD-01",
        "variant_name": "250ml",
        "stock": 0,
        "price_override": 15000.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {
            "name": "Shampoo Profesional Reparador",
            "base_price": 15000.0,
            "is_active": True,
        },
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])

    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())

    req = OrderCheckoutRequest(
        customer_name="Valeria Gómez",
        customer_email="valeria@example.com",
        customer_phone="1144332211",
        shipping_address="Av. Corrientes 1234",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1043",
        shipping_cost=Decimal("1500.00"),
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )

    with pytest.raises(ValueError) as exc_info:
        await service.create_order(req)

    assert "Stock insuficiente" in str(exc_info.value)
    assert "Stock disponible: 0, solicitado: 1" in str(exc_info.value)
    # Verificar que NUNCA se llamó a insertar orden
    mock_supabase.table("orders").insert.assert_not_called()


@pytest.mark.anyio
async def test_flow_1_concurrent_race_condition_prevents_overselling():
    """Escenario: Dos compradores compiten concurrentemente por la última unidad disponible (stock=1).
    Uno solo debe ganar la compra y el otro debe recibir rechazo inmediato.
    """
    variant_id = str(uuid4())
    stock_state = {"stock": 1}

    mock_supabase = MagicMock()

    def mock_variant_select(*args, **kwargs):
        mock_query = MagicMock()
        def mock_execute():
            return MagicMock(data=[{
                "id": variant_id,
                "sku": "NOV-RACE-99",
                "variant_name": "Edición Limitada",
                "stock": stock_state["stock"],
                "price_override": 8500.0,
                "is_active": True,
                "product_id": str(uuid4()),
                "products": {"name": "Serum Capilar Oro", "base_price": 8500.0, "is_active": True},
            }])
        mock_query.eq.return_value.execute = mock_execute
        mock_query.execute = mock_execute
        return mock_query

    mock_variants_table = MagicMock()
    mock_orders_table = MagicMock()
    mock_order_items_table = MagicMock()

    mock_variants_table.select.side_effect = mock_variant_select

    def mock_order_insert(payload=None):
        mock_exec = MagicMock()
        stock_state["stock"] -= 1
        mock_exec.execute.return_value = MagicMock(data=[{
            "id": str(uuid4()),
            "order_number": f"ORD-2026-{uuid4().hex[:5]}",
            "status": "pending",
            "subtotal": 8500.0,
            "total": 8500.0,
            "shipping_cost": 0.0,
        }])
        return mock_exec

    mock_orders_table.select().order().limit().execute.return_value = MagicMock(data=[])
    mock_orders_table.insert.side_effect = mock_order_insert
    mock_order_items_table.insert.return_value.execute.return_value = MagicMock(data=[{"id": str(uuid4())}])

    def router(table_name):
        if table_name == "product_variants":
            return mock_variants_table
        if table_name == "orders":
            return mock_orders_table
        if table_name == "order_items":
            return mock_order_items_table
        return MagicMock()

    mock_supabase.table.side_effect = router
    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())

    req1 = OrderCheckoutRequest(
        customer_name="Comprador A", customer_email="a@example.com", customer_phone="111",
        shipping_address="Calle A", shipping_city="CABA", shipping_province="Buenos Aires", shipping_postal_code="1000",
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )
    req2 = OrderCheckoutRequest(
        customer_name="Comprador B", customer_email="b@example.com", customer_phone="222",
        shipping_address="Calle B", shipping_city="CABA", shipping_province="Buenos Aires", shipping_postal_code="1000",
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )

    results = await asyncio.gather(service.create_order(req1), service.create_order(req2), return_exceptions=True)
    successes = [r for r in results if not isinstance(r, Exception)]
    failures = [r for r in results if isinstance(r, Exception)]

    assert len(successes) == 1, "Solo una compra debe ser aprobada"
    assert len(failures) == 1, "La compra concurrente excedente debe ser rechazada"
    assert "Stock insuficiente" in str(failures[0])


# ==============================================================================
# FLUJO 2: Aceptación de Pago, Acreditación Atómica e Idempotencia
# ==============================================================================

@pytest.mark.anyio
async def test_flow_2_mark_order_paid_decrements_stock_and_is_idempotent():
    """Escenario: Orden en 'pending' recibe confirmación de pago.
    Debe transicionar a 'paid', descontar stock y registrar pago.
    Si se vuelve a invocar por duplicación de webhook, no debe descontar stock repetido.
    """
    order_id = str(uuid4())
    variant_id = str(uuid4())
    order_number = "ORD-2026-00042"

    mock_supabase = MagicMock()
    order_state = {
        "id": order_id,
        "order_number": order_number,
        "status": "pending",
        "total": 9500.0,
        "order_items": [
            {"product_variant_id": variant_id, "quantity": 2}
        ],
    }
    variant_stock = {"current": 10}

    # Mock order lookup
    def mock_order_select(*args, **kwargs):
        mock_q = MagicMock()
        mock_q.eq.return_value.execute.return_value = MagicMock(data=[dict(order_state)])
        return mock_q

    # Mock variant lookup & update
    def mock_variant_select(*args, **kwargs):
        mock_q = MagicMock()
        mock_q.eq.return_value.execute.return_value = MagicMock(data=[{"stock": variant_stock["current"]}])
        return mock_q

    def mock_variant_update(update_payload):
        mock_q = MagicMock()
        def mock_eq(col, val):
            variant_stock["current"] = update_payload["stock"]
            return MagicMock(execute=lambda: MagicMock(data=[]))
        mock_q.eq = mock_eq
        return mock_q

    def mock_order_update(update_payload):
        mock_q = MagicMock()
        def mock_eq(col, val):
            order_state["status"] = update_payload["status"]
            return MagicMock(execute=lambda: MagicMock(data=[]))
        mock_q.eq = mock_eq
        return mock_q

    mock_orders = MagicMock()
    mock_orders.select.side_effect = mock_order_select
    mock_orders.update.side_effect = mock_order_update

    mock_variants = MagicMock()
    mock_variants.select.side_effect = mock_variant_select
    mock_variants.update.side_effect = mock_variant_update

    mock_payments = MagicMock()
    mock_payments.insert.return_value.execute.return_value = MagicMock(data=[{"id": str(uuid4())}])

    def router(table_name):
        if table_name == "orders":
            return mock_orders
        if table_name == "product_variants":
            return mock_variants
        if table_name == "payments":
            return mock_payments
        return MagicMock()

    mock_supabase.table.side_effect = router
    service = OrderService(db_client=mock_supabase)

    # 1era ejecución: Acreditación inicial
    result = await service.mark_order_paid(
        order_number=order_number,
        payment_id="mp-pay-12345",
        payment_details={"status_detail": "accredited"},
    )
    assert result is True
    assert order_state["status"] == "paid"
    assert variant_stock["current"] == 8, "El stock debe haberse decrementado de 10 a 8 (10 - 2)"
    assert mock_payments.insert.call_count == 1

    # 2da ejecución: Webhook duplicado (Idempotencia)
    result_dup = await service.mark_order_paid(
        order_number=order_number,
        payment_id="mp-pay-12345",
        payment_details={"status_detail": "accredited"},
    )
    assert result_dup is True
    assert variant_stock["current"] == 8, "El stock NO debe descontarse nuevamente en reintentos"
    assert mock_payments.insert.call_count == 1, "No debe duplicarse el registro en tabla payments"


@pytest.mark.anyio
async def test_flow_2_webhook_end_to_end_with_valid_hmac():
    """Escenario: Endpoint POST /api/webhooks/mercadopago con payload real y firma HMAC."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.routers.webhooks.get_payment_provider") as mock_prov_fn, \
             patch("app.routers.webhooks.OrderService.mark_order_paid", new_callable=AsyncMock) as mock_mark:

            mock_prov = AsyncMock()
            mock_prov.verify_webhook_signature.return_value = True
            mock_prov.get_payment_details.return_value = {
                "id": "987654321",
                "status": "approved",
                "status_detail": "accredited",
                "external_reference": "ORD-2026-00077",
            }
            mock_prov_fn.return_value = mock_prov
            mock_mark.return_value = True

            res = await client.post(
                "/api/webhooks/mercadopago?data.id=987654321",
                json={"type": "payment", "data": {"id": "987654321"}},
                headers={"x-signature": "ts=1720000000,v1=validhash"},
            )
            assert res.status_code == 200
            assert res.json() == {"status": "received"}
            mock_mark.assert_awaited_once_with(
                "ORD-2026-00077",
                payment_id="987654321",
                payment_details={
                    "id": "987654321",
                    "status": "approved",
                    "status_detail": "accredited",
                    "external_reference": "ORD-2026-00077",
                },
            )


# ==============================================================================
# FLUJO 3: Anti-Spoofing en Confirmación de Pago (/confirm-payment)
# ==============================================================================

@pytest.mark.anyio
async def test_flow_3_confirm_payment_anti_spoofing_defense():
    """Escenario: Un usuario malicioso intenta asociar un pago ajeno (external_reference distinto)
    a su propia orden. El servicio debe detectar la discrepancia y rechazar la acreditación.
    """
    mock_supabase = MagicMock()
    mock_supabase.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "status": "pending", "order_number": "ORD-2026-00001", "total": 5000.0}]
    )

    mock_provider = AsyncMock()
    # Mercado Pago reporta que el pago pay-999 pertenece en realidad a ORD-2026-88888 (otro cliente)
    mock_provider.get_payment_details.return_value = {
        "status": "approved",
        "external_reference": "ORD-2026-88888",
    }

    service = OrderService(db_client=mock_supabase, payment_provider=mock_provider)

    with pytest.raises(ValueError, match="El identificador de pago no corresponde a este pedido"):
        await service.confirm_order_payment(order_number="ORD-2026-00001", payment_id="pay-999")


# ==============================================================================
# FLUJO 4: Rechazo de Pagos, Cancelación y Descarte de Borrador (Draft Discard)
# ==============================================================================

@pytest.mark.anyio
async def test_flow_4_delete_draft_order_on_rejected_or_cancelled_payment():
    """Escenario: El comprador retrocede, cancela o el pago es rechazado.
    La pantalla /pago/fallido llama a DELETE /api/orders/{order_number}/draft para eliminar
    el borrador 'pending' y liberar registros en BD.
    """
    order_id = str(uuid4())
    order_number = "ORD-2026-00099"

    mock_supabase = MagicMock()
    mock_orders = MagicMock()
    mock_order_items = MagicMock()

    # Estado 'pending': permitido eliminar
    mock_orders.select().eq().execute.return_value = MagicMock(data=[{"id": order_id, "status": "pending"}])
    mock_order_items.delete().eq().execute.return_value = MagicMock(data=[])
    mock_orders.delete().eq().execute.return_value = MagicMock(data=[])

    def router(table_name):
        if table_name == "orders":
            return mock_orders
        if table_name == "order_items":
            return mock_order_items
        return MagicMock()

    mock_supabase.table.side_effect = router
    service = OrderService(db_client=mock_supabase)

    success = await service.delete_draft_order(order_number)
    assert success is True
    mock_order_items.delete().eq.assert_called_with("order_id", order_id)
    mock_orders.delete().eq.assert_called_with("id", order_id)


@pytest.mark.anyio
async def test_flow_4_delete_draft_order_blocks_paid_or_shipped_orders():
    """Escenario de seguridad: Intentar borrar una orden que ya fue pagada ('paid')
    o enviada ('shipped') debe ser bloqueado terminantemente.
    """
    mock_supabase = MagicMock()
    mock_supabase.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "status": "paid"}]
    )

    service = OrderService(db_client=mock_supabase)
    with pytest.raises(ValueError, match="Solo se descartan órdenes pendientes"):
        await service.delete_draft_order("ORD-2026-00042")


# ==============================================================================
# FLUJO 5: Anti-Tampering de Precios, Costos de Envío e Inactividad
# ==============================================================================

@pytest.mark.anyio
async def test_flow_5_anti_tampering_overrides_client_prices_and_validates_shipping():
    """Escenario: El cliente intenta manipular el payload para pagar menos o envía shipping negativo."""
    variant_id = str(uuid4())
    order_id = str(uuid4())
    mock_supabase = MagicMock()

    # Base de datos tiene precio oficial 12000.00
    variant_data = {
        "id": variant_id,
        "sku": "NOV-TAMPER",
        "variant_name": "Premium",
        "stock": 5,
        "price_override": 12000.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {"name": "Tratamiento Keratina", "base_price": 10000.0, "is_active": True},
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])
    mock_supabase.table().select().order().limit().execute.return_value = MagicMock(data=[])

    inserted_order_holder = {}
    def mock_order_insert(payload):
        inserted_order_holder.update(payload)
        return MagicMock(execute=lambda: MagicMock(data=[{"id": order_id, **payload}]))

    mock_supabase.table("orders").insert.side_effect = mock_order_insert
    mock_supabase.table("order_items").insert.return_value.execute.return_value = MagicMock(data=[{"id": str(uuid4())}])

    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())

    # 1. Verificación de cálculo oficial de subtotal y total
    req = OrderCheckoutRequest(
        customer_name="Cliente Honesto", customer_email="cliente@example.com", customer_phone="11223344",
        shipping_address="Calle Verdadera 100", shipping_city="CABA", shipping_province="Buenos Aires", shipping_postal_code="1000",
        shipping_cost=Decimal("2500.00"),
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=2)],
    )

    resp = await service.create_order(req)
    assert resp.subtotal == Decimal("24000.00"), "Subtotal debe ser exactamente 2 * 12000.00"
    assert resp.shipping_cost == Decimal("2500.00")
    assert resp.total == Decimal("26500.00")

    # 2. Verificación de rechazo con costo de envío negativo
    req_tampered_shipping = req.model_copy(update={"shipping_cost": Decimal("-500.00")})
    with pytest.raises(ValueError, match="El costo de envío no puede ser negativo"):
        await service.create_order(req_tampered_shipping)


@pytest.mark.anyio
async def test_flow_5_inactive_product_or_variant_rejected():
    """Escenario: Si un producto o variante fue desactivado en el catálogo, no puede comprarse."""
    variant_id = str(uuid4())
    mock_supabase = MagicMock()
    variant_data = {
        "id": variant_id,
        "sku": "NOV-INACTIVE",
        "variant_name": "Inactivo",
        "stock": 10,
        "price_override": 5000.0,
        "is_active": False,  # Variante pausada por stock o retiro
        "product_id": str(uuid4()),
        "products": {"name": "Producto Descontinuado", "base_price": 5000.0, "is_active": True},
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])

    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())
    req = OrderCheckoutRequest(
        customer_name="Comprador", customer_email="c@example.com", customer_phone="111",
        shipping_address="Calle", shipping_city="CABA", shipping_province="Buenos Aires", shipping_postal_code="1000",
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )

    with pytest.raises(ValueError, match="no se encuentra disponible"):
        await service.create_order(req)


# ==============================================================================
# FLUJO 6: Tracking Público y Despacho en Panel Admin
# ==============================================================================

@pytest.mark.anyio
async def test_flow_6_order_tracking_generates_andreani_url_and_immutable_snapshot():
    """Escenario: Consulta pública del estado del pedido en /pedido/[orderNumber].
    Verifica que al existir tracking_number se genere la URL oficial de Andreani.
    """
    mock_supabase = MagicMock()
    order_data = {
        "id": str(uuid4()),
        "order_number": "ORD-2026-00088",
        "status": "shipped",
        "customer_name": "Mariana López",
        "customer_email": "mariana@example.com",
        "shipping_address": "Av. Santa Fe 2000",
        "shipping_city": "CABA",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1123",
        "shipping_cost": 2200.0,
        "subtotal": 14000.0,
        "total": 16200.0,
        "tracking_number": "360000987654321",
        "created_at": datetime.now().isoformat(),
        "order_items": [
            {
                "id": str(uuid4()),
                "order_id": str(uuid4()),
                "product_variant_id": str(uuid4()),
                "product_name": "Planchita Alisadora Titanio",
                "variant_name": "Rosa Gold",
                "sku": "NOV-PLANCHA-01",
                "quantity": 1,
                "unit_price": 14000.0,
                "subtotal": 14000.0,
            }
        ],
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[order_data])

    service = OrderService(db_client=mock_supabase)
    resp = await service.get_order_status("ORD-2026-00088")

    assert resp.order_number == "ORD-2026-00088"
    assert resp.status == OrderStatus.SHIPPED
    assert resp.tracking_number == "360000987654321"
    assert resp.tracking_url == "https://www.andreani.com/#!/informacionEnvio/360000987654321"
    assert len(resp.items) == 1
    assert resp.items[0].product_name == "Planchita Alisadora Titanio"


def test_flow_6_admin_order_status_update_cycle():
    """Escenario: Endpoint de administración PATCH /api/admin/orders/{order_number}/status.
    Valida el ciclo de despacho administrativo hacia 'shipped' con número de seguimiento.
    """
    from fastapi.testclient import TestClient

    from app.database import get_supabase_client
    from app.utils.security import create_access_token

    test_admin_id = str(uuid4())
    token = create_access_token(subject=test_admin_id)
    order_number = "ORD-2026-00088"

    mock_db = MagicMock()
    # Mock admin user auth
    admin_sel = MagicMock()
    admin_sel.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": test_admin_id, "email": "admin@natbell.com", "name": "Admin"}]
    )

    # Mock orders select (status paid)
    order_sel = MagicMock()
    order_sel.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": str(uuid4()), "status": "paid", "order_number": order_number}]
    )

    # Mock orders update (status shipped + tracking)
    order_up = MagicMock()
    order_up.eq.return_value.execute.return_value = MagicMock(
        data=[{"order_number": order_number, "status": "shipped", "tracking_number": "360000987654321"}]
    )

    def router(table_name):
        m = MagicMock()
        if table_name == "admin_users":
            m.select.return_value = admin_sel
            return m
        elif table_name == "orders":
            m.select.return_value = order_sel
            m.update.return_value = order_up
            return m
        return m

    mock_db.table.side_effect = router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        client = TestClient(app)
        res = client.patch(
            f"/api/admin/orders/{order_number}/status",
            json={"status": "shipped", "tracking_number": "360000987654321"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "shipped"
        assert data["tracking_number"] == "360000987654321"
    finally:
        app.dependency_overrides.clear()

