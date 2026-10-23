from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.main import app
from app.models.admin import AdminUserResponse
from app.models.order import OrderCheckoutItem, OrderCheckoutRequest
from app.services.order_service import OrderService

client = TestClient(app)

MOCK_ADMIN = AdminUserResponse(
    id=uuid4(),
    email="admin@natbell.com",
    name="Admin User",
    is_verified=True,
)


@pytest.fixture(autouse=True)
def cleanup_overrides():
    yield
    app.dependency_overrides.clear()


def test_validate_coupon_endpoint_success():
    mock_db = MagicMock()
    mock_coupon = {
        "id": str(uuid4()),
        "code": "PROMO15",
        "discount_percent": 15,
        "is_active": True,
        "max_uses": None,
        "times_used": 0,
        "expires_at": None,
    }
    mock_db.table().select().eq().execute.return_value = MagicMock(data=[mock_coupon])
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    response = client.post("/api/coupons/validate", json={"code": "promo15"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["code"] == "PROMO15"
    assert data["discount_percent"] == 15


def test_validate_coupon_endpoint_not_found():
    mock_db = MagicMock()
    mock_db.table().select().eq().execute.return_value = MagicMock(data=[])
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    response = client.post("/api/coupons/validate", json={"code": "INVALID"})
    assert response.status_code == 404
    assert "no existe" in response.json()["detail"].lower()


def test_admin_coupons_unauthorized():
    response = client.get("/api/admin/coupons")
    assert response.status_code == 401


def test_admin_coupons_crud_authorized():
    mock_db = MagicMock()
    coupon_id = str(uuid4())
    mock_coupon_record = {
        "id": coupon_id,
        "code": "CYBER20",
        "discount_percent": 20,
        "is_active": True,
        "max_uses": 100,
        "times_used": 2,
        "expires_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # list
    mock_db.table().select().order().execute.return_value = MagicMock(
        data=[mock_coupon_record]
    )
    # create
    mock_db.table().select().eq().execute.return_value = MagicMock(data=[])
    mock_db.table().insert().execute.return_value = MagicMock(data=[mock_coupon_record])
    # toggle
    mock_db.table().update().eq().execute.return_value = MagicMock(
        data=[{**mock_coupon_record, "is_active": False}]
    )
    # delete
    mock_db.table().delete().eq().execute.return_value = MagicMock(
        data=[{"id": coupon_id}]
    )

    app.dependency_overrides[get_current_admin] = lambda: MOCK_ADMIN
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    # 1. List
    list_res = client.get("/api/admin/coupons")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["code"] == "CYBER20"

    # 2. Create
    create_res = client.post(
        "/api/admin/coupons",
        json={"code": "CYBER20", "discount_percent": 20, "max_uses": 100},
    )
    assert create_res.status_code == 201
    assert create_res.json()["discount_percent"] == 20

    # 3. Toggle
    toggle_res = client.patch(
        f"/api/admin/coupons/{coupon_id}/toggle?is_active=false"
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # 4. Delete
    delete_res = client.delete(f"/api/admin/coupons/{coupon_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["id"] == coupon_id


@pytest.mark.anyio
async def test_order_service_applies_coupon_and_recalculates_total():
    mock_db = MagicMock()
    variant_id = uuid4()
    coupon_id = str(uuid4())

    # Mock product variant
    variant_data = {
        "id": str(variant_id),
        "sku": "NOV-4001",
        "variant_name": "500ml",
        "stock": 10,
        "price_override": 10000.0,
        "is_active": True,
        "product_id": str(uuid4()),
        "products": {
            "name": "Shampoo Premium",
            "base_price": 10000.0,
            "is_active": True,
        },
    }

    # Mock coupon lookup
    coupon_data = {
        "id": coupon_id,
        "code": "OFERTA20",
        "discount_percent": 20,
        "is_active": True,
        "max_uses": None,
        "times_used": 0,
        "expires_at": None,
    }

    # Table router for mock_db
    def table_router(table_name):
        m = MagicMock()
        if table_name == "product_variants":
            m.select().eq().execute.return_value = MagicMock(data=[variant_data])
            return m
        elif table_name == "coupons":
            m.select().eq().execute.return_value = MagicMock(data=[coupon_data])
            m.update().eq().execute.return_value = MagicMock(data=[{"times_used": 1}])
            return m
        elif table_name == "orders":
            m.select().eq().limit().execute.return_value = MagicMock(data=[])
            created_order = {
                "id": str(uuid4()),
                "order_number": "ORD-2026-00001",
                "status": "pending",
                "subtotal": 10000.0,
                "shipping_cost": 1500.0,
                "total": 9500.0,
                "coupon_code": "OFERTA20",
                "discount_amount": 2000.0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            m.insert().execute.return_value = MagicMock(data=[created_order])
            return m
        elif table_name == "order_items":
            m.insert().execute.return_value = MagicMock(data=[{"id": str(uuid4())}])
            return m
        return m

    mock_db.table.side_effect = table_router

    mock_payment_provider = MagicMock()
    mock_payment_provider.create_checkout_preference = AsyncMock(
        return_value=MagicMock(preference_id="pref-123", init_point="http://mp/pay", sandbox_init_point="http://mp/sandbox")
    )

    service = OrderService(db_client=mock_db, payment_provider=mock_payment_provider)
    checkout_request = OrderCheckoutRequest(
        customer_name="Juan Perez",
        customer_email="juan@example.com",
        customer_phone="1122334455",
        shipping_address="Calle Falsa 123",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1001",
        shipping_cost=Decimal("1500.00"),
        coupon_code="OFERTA20",
        items=[OrderCheckoutItem(product_variant_id=str(variant_id), quantity=1)],
    )

    with patch.object(service, "_get_next_order_sequence", new_callable=AsyncMock) as mock_seq:
        mock_seq.return_value = 1
        res = await service.create_order(checkout_request)

    # Subtotal 10.000 - 20% (2.000) + Envío 1.500 = Total 9.500
    assert res.subtotal == Decimal("10000.00")
    assert res.total == Decimal("9500.00")
    assert res.shipping_cost == Decimal("1500.00")


def test_validate_coupon_endpoint_already_used_by_email():
    mock_db = MagicMock()
    mock_coupon = {
        "id": str(uuid4()),
        "code": "PRIMERACOMPRA",
        "discount_percent": 10,
        "is_active": True,
        "max_uses": None,
        "times_used": 1,
        "expires_at": None,
    }

    def table_router(table_name):
        m = MagicMock()
        if table_name == "coupons":
            m.select().eq().execute.return_value = MagicMock(data=[mock_coupon])
            return m
        elif table_name == "orders":
            m.select().eq().ilike().in_().execute.return_value = MagicMock(data=[{"id": "existing-order"}])
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    response = client.post(
        "/api/coupons/validate",
        json={"code": "primeracompra", "customer_email": "repetido@natbell.com"},
    )
    assert response.status_code == 400
    assert "ya has utilizado este cupón" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_order_creation_blocked_when_coupon_already_used_by_email():
    from fastapi import HTTPException

    mock_db = MagicMock()
    variant_id = uuid4()
    coupon_id = str(uuid4())

    variant_data = {
        "id": str(variant_id),
        "sku": "TINT-001",
        "variant_name": "Tono 5.1",
        "stock": 10,
        "is_active": True,
        "price_override": None,
        "products": {
            "name": "Tintura Profesional",
            "base_price": 10000.0,
            "is_active": True,
        },
    }

    coupon_data = {
        "id": coupon_id,
        "code": "UNICAVEZ",
        "discount_percent": 10,
        "is_active": True,
        "max_uses": None,
        "times_used": 1,
        "expires_at": None,
    }

    def table_router(table_name):
        m = MagicMock()
        if table_name == "product_variants":
            m.select().eq().execute.return_value = MagicMock(data=[variant_data])
            return m
        elif table_name == "coupons":
            m.select().eq().execute.return_value = MagicMock(data=[coupon_data])
            return m
        elif table_name == "orders":
            # Simular que ya existe una orden activa con este cupón y email
            m.select().eq().ilike().in_().execute.return_value = MagicMock(data=[{"id": "ord-prev"}])
            return m
        return m

    mock_db.table.side_effect = table_router

    service = OrderService(db_client=mock_db, payment_provider=MagicMock())
    checkout_request = OrderCheckoutRequest(
        customer_name="Juan Perez",
        customer_email="juan@example.com",
        customer_phone="1122334455",
        shipping_address="Calle Falsa 123",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1001",
        shipping_cost=Decimal("1500.00"),
        coupon_code="UNICAVEZ",
        items=[OrderCheckoutItem(product_variant_id=str(variant_id), quantity=1)],
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_order(checkout_request)

    assert exc_info.value.status_code == 400
    assert "ya has utilizado este cupón" in exc_info.value.detail.lower()
