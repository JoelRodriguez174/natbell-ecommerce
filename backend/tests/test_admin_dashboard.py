from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_supabase_client
from app.main import app
from app.utils.security import create_access_token

client = TestClient(app)

TEST_ADMIN_ID = str(uuid4())
TEST_EMAIL = "admin@natbell.com"


def test_dashboard_metrics_unauthorized():
    res = client.get("/api/admin/dashboard/metrics")
    assert res.status_code == 401


def test_dashboard_metrics_authorized(monkeypatch):
    mock_db = MagicMock()

    # Mock admin user verification in dependency
    admin_select = MagicMock()
    admin_eq = MagicMock()
    admin_eq.execute.return_value = MagicMock(
        data=[
            {
                "id": TEST_ADMIN_ID,
                "email": TEST_EMAIL,
                "name": "Admin Principal",
                "created_at": "2026-09-16T12:00:00Z",
            }
        ]
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    # Mock orders query
    orders_select = MagicMock()
    orders_order = MagicMock()
    orders_order.execute.return_value = MagicMock(
        data=[
            {
                "id": str(uuid4()),
                "order_number": "ORD-2026-00001",
                "customer_name": "Juan Perez",
                "status": "paid",
                "total": "10000.00",
                "created_at": now_iso,
            },
            {
                "id": str(uuid4()),
                "order_number": "ORD-2026-00002",
                "customer_name": "Maria Lopez",
                "status": "pending",
                "total": "5000.00",
                "created_at": now_iso,
            },
            {
                "id": str(uuid4()),
                "order_number": "ORD-2026-00003",
                "customer_name": "Carlos Gomez",
                "status": "shipped",
                "total": "8000.00",
                "created_at": "2026-01-01T10:00:00Z",
            },
        ]
    )

    # Mock product_variants query
    variants_select = MagicMock()
    variants_lte = MagicMock()
    variants_eq = MagicMock()
    variants_order = MagicMock()
    variants_limit = MagicMock()
    variants_limit.execute.return_value = MagicMock(
        data=[
            {
                "id": str(uuid4()),
                "sku": "WAHL-SUP-01",
                "variant_name": "Estándar V5000",
                "stock": 2,
                "products": {"name": "Wahl Super Taper"},
            }
        ]
    )

    def table_router(table_name):
        if table_name == "admin_users":
            m = MagicMock()
            m.select.return_value = admin_select
            admin_select.eq.return_value = admin_eq
            return m
        elif table_name == "orders":
            m = MagicMock()
            m.select.return_value = orders_select
            orders_select.order.return_value = orders_order
            return m
        elif table_name == "product_variants":
            m = MagicMock()
            m.select.return_value = variants_select
            variants_select.lte.return_value = variants_lte
            variants_lte.eq.return_value = variants_eq
            variants_eq.order.return_value = variants_order
            variants_order.limit.return_value = variants_limit
            return m
        return MagicMock()

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        token = create_access_token(subject=TEST_ADMIN_ID)
        response = client.get(
            "/api/admin/dashboard/metrics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_orders"] == 3
        assert data["pending_orders"] == 1
        assert data["paid_orders"] == 1
        assert data["shipped_orders"] == 1
        assert float(data["total_revenue"]) == 18000.0
        assert float(data["today_revenue"]) == 10000.0
        assert data["low_stock_count"] == 1
        assert len(data["recent_orders"]) == 3
    finally:
        app.dependency_overrides.clear()
