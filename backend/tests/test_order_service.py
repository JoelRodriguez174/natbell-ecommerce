from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock, patch
import pytest
from app.models.order import (
    OrderStatus,
    OrderCheckoutItem,
    OrderCheckoutRequest,
    OrderCreateResponse,
    OrderStatusResponse,
)
from app.services.order_service import OrderService


@pytest.fixture
def sample_checkout_request():
    variant_id = uuid4()
    item = OrderCheckoutItem(product_variant_id=str(variant_id), quantity=2)
    return OrderCheckoutRequest(
        customer_name="Romina Diaz",
        customer_email="romina@example.com",
        customer_phone="1144556677",
        shipping_address="Belgrano 456",
        shipping_city="Ramos Mejia",
        shipping_province="Buenos Aires",
        shipping_postal_code="1704",
        shipping_cost=Decimal("1200.00"),
        notes="Dejar en porteria",
        items=[item],
    )


@pytest.mark.anyio
async def test_order_service_stock_insufficient(sample_checkout_request):
    mock_supabase = MagicMock()
    # Mock variant lookup returning stock = 1 (request needs 2)
    variant_data = {
        "id": str(sample_checkout_request.items[0].product_variant_id),
        "sku": "NOV-4001",
        "variant_name": "500ml",
        "stock": 1,
        "price_override": 3000.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {
            "name": "Baño de Crema",
            "base_price": 2800.0,
            "is_active": True,
        },
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])

    service = OrderService(db_client=mock_supabase)
    with pytest.raises(ValueError, match="Stock insuficiente"):
        await service.create_order(sample_checkout_request)


@pytest.mark.anyio
async def test_order_service_anti_price_tampering_and_creation(sample_checkout_request):
    variant_id = str(sample_checkout_request.items[0].product_variant_id)
    order_id = str(uuid4())

    mock_supabase = MagicMock()
    # 1. Variant lookup: stock 10, price_override 5000.00
    variant_data = {
        "id": variant_id,
        "sku": "NOV-4001",
        "variant_name": "500ml",
        "stock": 10,
        "price_override": 5000.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {
            "name": "Baño de Crema Nutritivo",
            "base_price": 4500.0,
            "is_active": True,
        },
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[variant_data])

    # 2. Sequence lookup (count of orders)
    mock_supabase.table().select().order().limit().execute.return_value = MagicMock(data=[])

    # 3. Order insert
    order_inserted = {
        "id": order_id,
        "order_number": "ORD-2026-00001",
        "status": "pending",
        "customer_name": sample_checkout_request.customer_name,
        "customer_email": sample_checkout_request.customer_email,
        "customer_phone": sample_checkout_request.customer_phone,
        "shipping_address": sample_checkout_request.shipping_address,
        "shipping_city": sample_checkout_request.shipping_city,
        "shipping_province": sample_checkout_request.shipping_province,
        "shipping_postal_code": sample_checkout_request.shipping_postal_code,
        "shipping_cost": float(sample_checkout_request.shipping_cost),
        "subtotal": 10000.0,  # 2 * 5000.00
        "total": 11200.0,     # 10000 + 1200
        "notes": sample_checkout_request.notes,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[order_inserted])

    from app.services.payment_service import MockPaymentProvider
    service = OrderService(db_client=mock_supabase, payment_provider=MockPaymentProvider())
    resp = await service.create_order(sample_checkout_request)

    assert isinstance(resp, OrderCreateResponse)
    assert resp.order_number.startswith("ORD-")
    assert resp.subtotal == Decimal("10000.00")
    assert resp.total == Decimal("11200.00")
    assert "pago" in resp.checkout_url


@pytest.mark.anyio
async def test_order_service_get_order_status():
    order_id = str(uuid4())
    mock_supabase = MagicMock()
    order_data = {
        "id": order_id,
        "order_number": "ORD-2026-00001",
        "status": "paid",
        "customer_name": "Romina Diaz",
        "customer_email": "romina@example.com",
        "customer_phone": "1144556677",
        "shipping_address": "Belgrano 456",
        "shipping_city": "Ramos Mejia",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1704",
        "shipping_cost": 1200.0,
        "subtotal": 10000.0,
        "total": 11200.0,
        "notes": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "order_items": [
            {
                "id": str(uuid4()),
                "order_id": order_id,
                "product_variant_id": str(uuid4()),
                "product_name": "Baño de Crema",
                "variant_name": "500ml",
                "sku": "NOV-4001",
                "quantity": 2,
                "unit_price": 5000.0,
                "subtotal": 10000.0,
            }
        ],
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[order_data])

    service = OrderService(db_client=mock_supabase)
    status_resp = await service.get_order_status("ORD-2026-00001")

    assert isinstance(status_resp, OrderStatusResponse)
    assert status_resp.order_number == "ORD-2026-00001"
    assert status_resp.status == OrderStatus.PAID
    assert len(status_resp.items) == 1


@pytest.mark.anyio
async def test_order_service_mark_order_paid_idempotent():
    order_id = str(uuid4())
    mock_supabase = MagicMock()
    # Initial order is pending
    pending_order_data = {
        "id": order_id,
        "order_number": "ORD-2026-00002",
        "status": "pending",
        "total": 5000.0,
        "order_items": [
            {
                "product_variant_id": str(uuid4()),
                "quantity": 1,
            }
        ],
    }
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[pending_order_data])
    mock_supabase.table().update().eq().execute.return_value = MagicMock(data=[])
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[])

    service = OrderService(db_client=mock_supabase)
    res = await service.mark_order_paid("ORD-2026-00002", payment_id="pay-123")
    assert res is True

    # Call second time (already paid)
    paid_order_data = dict(pending_order_data, status="paid")
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[paid_order_data])
    res_second = await service.mark_order_paid("ORD-2026-00002", payment_id="pay-123")
    assert res_second is True

