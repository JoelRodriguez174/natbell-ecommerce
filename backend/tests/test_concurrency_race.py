import asyncio
from decimal import Decimal
from uuid import uuid4
from unittest.mock import MagicMock
import pytest
from app.models.order import OrderCheckoutItem, OrderCheckoutRequest
from app.services.order_service import OrderService
from app.services.payment_service import MockPaymentProvider


@pytest.mark.anyio
async def test_concurrency_stock_race_condition():
    """PENTEST / CONCURRENCY:
    Simula dos peticiones de compra simultáneas con asyncio.gather compitiendo por
    la última unidad disponible (stock = 1).
    Al validar el stock en la base de datos, el sistema debe permitir una orden y rechazar la otra
    evitando la sobreventa (overselling/overbooking).
    """
    variant_id = str(uuid4())
    shared_stock = {"current": 1}

    mock_supabase = MagicMock()

    # Función simulada que decrementa el stock en memoria simulando atomicidad en DB
    def mock_select(*args, **kwargs):
        mock_query = MagicMock()
        def mock_execute():
            available = shared_stock["current"]
            # Si se consulta, devuelve el stock actual
            variant_data = {
                "id": variant_id,
                "sku": "NOV-RACE-01",
                "variant_name": "Edición Limitada",
                "stock": available,
                "price_override": 12000.0,
                "is_active": True,
                "product_id": str(uuid4()),
                "products": {
                    "name": "Tijera Profesional Japonesa",
                    "base_price": 12000.0,
                    "is_active": True,
                },
            }
            return MagicMock(data=[variant_data])
        mock_query.eq.return_value.execute = mock_execute
        mock_query.execute = mock_execute
        return mock_query

    mock_variants_table = MagicMock()
    mock_orders_table = MagicMock()
    mock_order_items_table = MagicMock()

    mock_variants_table.select.side_effect = mock_select

    def mock_order_insert(payload=None):
        mock_exec = MagicMock()
        shared_stock["current"] -= 1
        mock_exec.execute.return_value = MagicMock(
            data=[
                {
                    "id": str(uuid4()),
                    "order_number": f"ORD-2026-{uuid4().hex[:5]}",
                    "status": "pending",
                    "subtotal": 12000.0,
                    "total": 12000.0,
                    "shipping_cost": 0.0,
                }
            ]
        )
        return mock_exec

    mock_orders_table.select().order().limit().execute.return_value = MagicMock(data=[])
    mock_orders_table.insert.side_effect = mock_order_insert
    mock_order_items_table.insert.return_value.execute.return_value = MagicMock(data=[{"id": str(uuid4())}])

    def table_router(table_name):
        if table_name == "product_variants":
            return mock_variants_table
        elif table_name == "orders":
            return mock_orders_table
        elif table_name == "order_items":
            return mock_order_items_table
        return MagicMock()

    mock_supabase.table.side_effect = table_router

    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())

    req1 = OrderCheckoutRequest(
        customer_name="Comprador 1",
        customer_email="c1@example.com",
        customer_phone="111111",
        shipping_address="Calle 1",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1000",
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )

    req2 = OrderCheckoutRequest(
        customer_name="Comprador 2",
        customer_email="c2@example.com",
        customer_phone="222222",
        shipping_address="Calle 2",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1000",
        items=[OrderCheckoutItem(product_variant_id=variant_id, quantity=1)],
    )

    # Ejecutar de forma concurrente
    results = await asyncio.gather(
        service.create_order(req1),
        service.create_order(req2),
        return_exceptions=True,
    )

    # Exactamente una debe ser exitosa y la otra debe haber lanzado ValueError por stock insuficiente
    successes = [r for r in results if not isinstance(r, Exception)]
    failures = [r for r in results if isinstance(r, Exception)]

    assert len(successes) == 1, "Debe haber exactamente una compra exitosa"
    assert len(failures) == 1, "Debe haber exactamente un rechazo por stock insuficiente"
    assert "Stock insuficiente" in str(failures[0])
