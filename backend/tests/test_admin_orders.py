from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_supabase_client
from app.main import app
from app.utils.security import create_access_token

client = TestClient(app)

TEST_ADMIN_ID = str(uuid4())
TEST_EMAIL = "admin@natbell.com"


def _setup_mock_db():
    mock_db = MagicMock()

    admin_sel = MagicMock()
    admin_eq = MagicMock()
    admin_eq.execute.return_value = MagicMock(
        data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
    )
    admin_sel.eq.return_value = admin_eq

    def table_router(table_name):
        m = MagicMock()
        if table_name == "admin_users":
            m.select.return_value = admin_sel
            return m
        return m

    mock_db.table.side_effect = table_router
    return mock_db


def test_admin_orders_unauthorized():
    res = client.get("/api/admin/orders")
    assert res.status_code == 401


def test_admin_orders_list_and_detail():
    mock_db = _setup_mock_db()
    token = create_access_token(subject=TEST_ADMIN_ID)

    order_num = "ORD-2026-00001"
    order_data = {
        "id": str(uuid4()),
        "order_number": order_num,
        "customer_name": "Valeria Rossi",
        "customer_email": "valeria@example.com",
        "status": "paid",
        "total": "12500.00",
        "order_items": [
            {"product_name": "Serum Facial", "variant_name": "30ml", "quantity": 1}
        ],
    }

    # Setup orders query
    orders_sel = MagicMock()
    orders_order = MagicMock()
    orders_range = MagicMock()
    orders_exec = MagicMock(data=[order_data], count=1)
    orders_range.execute.return_value = orders_exec
    orders_order.range.return_value = orders_range
    orders_sel.order.return_value = orders_order

    # Detail query
    detail_sel = MagicMock()
    detail_eq = MagicMock()
    detail_eq.execute.return_value = MagicMock(data=[order_data])
    detail_sel.eq.return_value = detail_eq

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            sel = MagicMock()
            eq = MagicMock()
            eq.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            sel.eq.return_value = eq
            m.select.return_value = sel
            return m
        elif name == "orders":
            m.select.side_effect = lambda *args, **kwargs: (
                orders_sel if "count" in kwargs else detail_sel
            )
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        # List
        res_list = client.get(
            "/api/admin/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_list.status_code == 200
        assert res_list.json()["total"] == 1
        assert res_list.json()["items"][0]["order_number"] == order_num

        # Detail
        res_detail = client.get(
            f"/api/admin/orders/{order_num}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_detail.status_code == 200
        assert res_detail.json()["order_number"] == order_num
    finally:
        app.dependency_overrides.clear()


def test_admin_update_order_status():
    mock_db = _setup_mock_db()
    token = create_access_token(subject=TEST_ADMIN_ID)
    order_num = "ORD-2026-00001"

    # Select existing
    sel_mock = MagicMock()
    eq_mock = MagicMock()
    eq_mock.execute.return_value = MagicMock(data=[{"id": str(uuid4()), "status": "paid"}])
    sel_mock.eq.return_value = eq_mock

    # Update
    up_mock = MagicMock()
    up_eq = MagicMock()
    up_eq.execute.return_value = MagicMock(
        data=[{"order_number": order_num, "status": "shipped", "tracking_number": "TRK123456"}]
    )
    up_mock.eq.return_value = up_eq

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            s = MagicMock()
            e = MagicMock()
            e.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            s.eq.return_value = e
            m.select.return_value = s
            return m
        elif name == "orders":
            m.select.return_value = sel_mock
            m.update.return_value = up_mock
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.patch(
            f"/api/admin/orders/{order_num}/status",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "shipped", "tracking_number": "TRK123456"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "shipped"
        assert res.json()["tracking_number"] == "TRK123456"
    finally:
        app.dependency_overrides.clear()


def test_admin_shipping_zones_crud():
    mock_db = _setup_mock_db()
    token = create_access_token(subject=TEST_ADMIN_ID)
    zone_id = str(uuid4())

    zone_data = {
        "id": zone_id,
        "zone_name": "CABA y AMBA",
        "postal_code_ranges": [{"from": 1000, "to": 1499}],
        "cost": 3200.0,
        "estimated_days": 2,
        "is_active": True,
    }

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            s = MagicMock()
            e = MagicMock()
            e.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            s.eq.return_value = e
            m.select.return_value = s
            return m
        elif name == "shipping_zones":
            sel = MagicMock()
            ord_mock = MagicMock()
            ord_mock.execute.return_value = MagicMock(data=[zone_data])
            sel.order.return_value = ord_mock
            m.select.return_value = sel

            ins = MagicMock()
            ins.execute.return_value = MagicMock(data=[zone_data])
            m.insert.return_value = ins

            up = MagicMock()
            up_eq = MagicMock()
            up_eq.execute.return_value = MagicMock(data=[{**zone_data, "cost": 3500.0}])
            up.eq.return_value = up_eq
            m.update.return_value = up
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        # List
        res_list = client.get(
            "/api/admin/shipping/zones",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_list.status_code == 200
        assert len(res_list.json()) == 1

        # Create
        res_create = client.post(
            "/api/admin/shipping/zones",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "zone_name": "CABA y AMBA",
                "postal_code_ranges": [{"from": 1000, "to": 1499}],
                "cost": 3200.0,
                "estimated_days": 2,
            },
        )
        assert res_create.status_code == 201

        # Update
        res_up = client.put(
            f"/api/admin/shipping/zones/{zone_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"cost": 3500.0},
        )
        assert res_up.status_code == 200
        assert res_up.json()["cost"] == 3500.0
    finally:
        app.dependency_overrides.clear()


def test_admin_generate_andreani_shipment_success():
    from unittest.mock import AsyncMock, patch

    mock_db = _setup_mock_db()
    token = create_access_token(subject=TEST_ADMIN_ID)
    order_num = "ORD-2026-00002"

    order_data = {
        "id": str(uuid4()),
        "order_number": order_num,
        "customer_name": "Mauro Rodriguez",
        "customer_email": "mauro@example.com",
        "status": "paid",
        "total": "25000.00",
        "shipping_cost": "3500.00",
        "shipping_address": "Av. Rivadavia 1234",
        "shipping_city": "Ramos Mejia",
        "shipping_province": "Buenos Aires",
        "shipping_postal_code": "1704",
        "order_items": [],
    }

    # Detail query
    detail_sel = MagicMock()
    detail_eq = MagicMock()
    detail_eq.execute.return_value = MagicMock(data=[order_data])
    detail_sel.eq.return_value = detail_eq

    # Update query
    up_mock = MagicMock()
    up_eq = MagicMock()
    up_eq.execute.return_value = MagicMock(
        data=[{**order_data, "status": "shipped", "tracking_number": "ANDR_TRACK_123"}]
    )
    up_mock.eq.return_value = up_eq

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            s = MagicMock()
            e = MagicMock()
            e.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            s.eq.return_value = e
            m.select.return_value = s
            return m
        elif name == "orders":
            m.select.return_value = detail_sel
            m.update.return_value = up_mock
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    mock_andreani_resp = {
        "tracking_number": "ANDR_TRACK_123",
        "tracking_url": "https://www.andreani.com/#!/informacionEnvio/ANDR_TRACK_123",
    }

    with patch("app.services.admin_order_service.get_andreani_service") as mock_get_andreani, \
         patch("app.services.admin_order_service.get_email_service") as mock_get_email:
        mock_andreani_svc = MagicMock()
        mock_andreani_svc.register_shipment.return_value = mock_andreani_resp
        mock_get_andreani.return_value = mock_andreani_svc

        mock_email_svc = MagicMock()
        mock_email_svc.send_shipping_notification_email = AsyncMock(return_value=True)
        mock_get_email.return_value = mock_email_svc

        try:
            res = client.post(
                f"/api/admin/orders/{order_num}/generate-andreani-shipment",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["order_number"] == order_num
            assert data["status"] == "shipped"
            assert data["tracking_number"] == "ANDR_TRACK_123"
            assert "https://www.andreani.com" in data["tracking_url"]

            mock_andreani_svc.register_shipment.assert_called_once()
            mock_email_svc.send_shipping_notification_email.assert_called_once()
        finally:
            app.dependency_overrides.clear()


def test_admin_generate_andreani_shipment_failure():
    from unittest.mock import patch

    mock_db = _setup_mock_db()
    token = create_access_token(subject=TEST_ADMIN_ID)
    order_num = "ORD-2026-00003"

    order_data = {
        "id": str(uuid4()),
        "order_number": order_num,
        "customer_name": "Mauro Rodriguez",
        "customer_email": "mauro@example.com",
        "status": "paid",
        "order_items": [],
    }

    detail_sel = MagicMock()
    detail_eq = MagicMock()
    detail_eq.execute.return_value = MagicMock(data=[order_data])
    detail_sel.eq.return_value = detail_eq

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            s = MagicMock()
            e = MagicMock()
            e.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            s.eq.return_value = e
            m.select.return_value = s
            return m
        elif name == "orders":
            m.select.return_value = detail_sel
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    with patch("app.services.admin_order_service.get_andreani_service") as mock_get_andreani:
        mock_andreani_svc = MagicMock()
        mock_andreani_svc.register_shipment.side_effect = RuntimeError("Andreani API Timeout")
        mock_get_andreani.return_value = mock_andreani_svc

        try:
            res = client.post(
                f"/api/admin/orders/{order_num}/generate-andreani-shipment",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert res.status_code == 400
            assert "Error generando envío en Andreani" in res.json()["detail"]
        finally:
            app.dependency_overrides.clear()

