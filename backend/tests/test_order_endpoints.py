from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.order import (
    OrderCreateResponse,
    OrderStatus,
    OrderStatusResponse,
)


@pytest.mark.anyio
async def test_create_order_endpoint_success():
    mock_create_resp = OrderCreateResponse(
        order_id=uuid4(),
        order_number="ORD-2026-00001",
        status=OrderStatus.PENDING,
        subtotal=Decimal("8000.00"),
        shipping_cost=Decimal("1500.00"),
        total=Decimal("9500.00"),
        checkout_url="http://localhost:3000/pago/simulador?order=ORD-2026-00001",
    )

    payload = {
        "customer_name": "Luciana Martinez",
        "customer_email": "luciana@example.com",
        "customer_phone": "1199887766",
        "shipping_address": "San Martin 100",
        "shipping_city": "Avellaneda",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1870",
        "shipping_cost": 1500.0,
        "items": [
            {
                "product_variant_id": str(uuid4()),
                "quantity": 2,
            }
        ],
    }

    with patch("app.routers.orders.OrderService.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_create_resp

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post("/api/orders", json=payload)
            assert res.status_code == 201
            data = res.json()
            assert data["order_number"] == "ORD-2026-00001"
            assert data["total"] == "9500.00"
            assert "checkout_url" in data


@pytest.mark.anyio
async def test_create_order_endpoint_insufficient_stock():
    payload = {
        "customer_name": "Luciana Martinez",
        "customer_email": "luciana@example.com",
        "customer_phone": "1199887766",
        "shipping_address": "San Martin 100",
        "shipping_city": "Avellaneda",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1870",
        "items": [
            {
                "product_variant_id": str(uuid4()),
                "quantity": 50,
            }
        ],
    }

    with patch("app.routers.orders.OrderService.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = ValueError("Stock insuficiente para el producto.")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post("/api/orders", json=payload)
            assert res.status_code == 400
            assert "Stock insuficiente" in res.json()["detail"]


@pytest.mark.anyio
async def test_get_order_status_endpoint_found():
    from datetime import datetime
    mock_status_resp = OrderStatusResponse(
        order_number="ORD-2026-00001",
        status=OrderStatus.PAID,
        customer_name="Luciana Martinez",
        customer_email="luciana@example.com",
        shipping_address="San Martin 100",
        shipping_city="Avellaneda",
        shipping_province="Buenos Aires",
        shipping_postal_code="1870",
        shipping_cost=Decimal("1500.00"),
        subtotal=Decimal("8000.00"),
        total=Decimal("9500.00"),
        created_at=datetime.now(),
        items=[],
    )

    with patch("app.routers.orders.OrderService.get_order_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = mock_status_resp

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/orders/ORD-2026-00001/status")
            assert res.status_code == 200
            data = res.json()
            assert data["order_number"] == "ORD-2026-00001"
            assert data["status"] == "paid"


@pytest.mark.anyio
async def test_get_order_status_endpoint_not_found():
    with patch("app.routers.orders.OrderService.get_order_status", new_callable=AsyncMock) as mock_status:
        mock_status.side_effect = KeyError("Pedido no encontrado")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/orders/ORD-2026-99999/status")
            assert res.status_code == 404


@pytest.mark.anyio
async def test_get_order_status_endpoint_with_tracking():
    from datetime import datetime
    mock_status_resp = OrderStatusResponse(
        order_number="ORD-2026-00001",
        status=OrderStatus.SHIPPED,
        customer_name="Luciana Martinez",
        customer_email="luciana@example.com",
        shipping_address="San Martin 100",
        shipping_city="Avellaneda",
        shipping_province="Buenos Aires",
        shipping_postal_code="1870",
        shipping_cost=Decimal("1500.00"),
        subtotal=Decimal("8000.00"),
        total=Decimal("9500.00"),
        tracking_number="360000123456789",
        tracking_url="https://www.andreani.com/#!/informacionEnvio/360000123456789",
        created_at=datetime.now(),
        items=[],
    )

    with patch("app.routers.orders.OrderService.get_order_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = mock_status_resp

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/orders/ORD-2026-00001/status")
            assert res.status_code == 200
            data = res.json()
            assert data["tracking_number"] == "360000123456789"
            assert data["tracking_url"] == "https://www.andreani.com/#!/informacionEnvio/360000123456789"


@pytest.mark.anyio
async def test_delete_draft_order_endpoint_success():
    with patch("app.routers.orders.OrderService.delete_draft_order", new_callable=AsyncMock) as mock_del:
        mock_del.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.delete("/api/orders/ORD-2026-00001")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "deleted"
            assert data["order_number"] == "ORD-2026-00001"
            mock_del.assert_awaited_once_with("ORD-2026-00001")


@pytest.mark.anyio
async def test_delete_draft_order_endpoint_already_paid_fails():
    with patch("app.routers.orders.OrderService.delete_draft_order", new_callable=AsyncMock) as mock_del:
        mock_del.side_effect = ValueError("No es posible descartar una orden con estado 'paid'.")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.delete("/api/orders/ORD-2026-00001")
            assert res.status_code == 400
            assert "No es posible descartar" in res.json()["detail"]

