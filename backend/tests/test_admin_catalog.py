import io
from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_supabase_client
from app.main import app
from app.utils.security import create_access_token

client = TestClient(app)

TEST_ADMIN_ID = str(uuid4())
TEST_EMAIL = "admin@natbell.com"


def _setup_admin_override():
    mock_db = MagicMock()
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

    def table_router(name):
        m = MagicMock()
        if name == "admin_users":
            m.select.return_value = admin_select
            admin_select.eq.return_value = admin_eq
        return m

    mock_db.table.side_effect = table_router
    return mock_db


def test_create_product_unauthorized():
    res = client.post(
        "/api/admin/products",
        json={
            "name": "Shampoo Profesional",
            "category_id": str(uuid4()),
            "brand_id": str(uuid4()),
            "base_price": 5000.0,
        },
    )
    assert res.status_code == 401


def test_create_product_success():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)

    prod_id = str(uuid4())
    var_id = str(uuid4())

    # Products slug check
    slug_select = MagicMock()
    slug_eq = MagicMock()
    slug_eq.execute.return_value = MagicMock(data=[])

    # Products insert
    prod_insert = MagicMock()
    prod_insert.execute.return_value = MagicMock(
        data=[
            {
                "id": prod_id,
                "name": "Shampoo Profesional Keratina",
                "slug": "shampoo-profesional-keratina",
                "base_price": 5000.0,
                "is_active": True,
            }
        ]
    )

    # Variant insert
    var_insert = MagicMock()
    var_insert.execute.return_value = MagicMock(
        data=[
            {
                "id": var_id,
                "product_id": prod_id,
                "sku": "SHAMP-KER-500",
                "variant_name": "500ml",
                "stock": 15,
                "is_active": True,
            }
        ]
    )

    def table_side_effect(name):
        m = MagicMock()
        if name == "admin_users":
            admin_sel = MagicMock()
            admin_eq = MagicMock()
            admin_eq.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            m.select.return_value = admin_sel
            admin_sel.eq.return_value = admin_eq
            return m
        elif name == "products":
            m.select.return_value = slug_select
            slug_select.eq.return_value = slug_eq
            m.insert.return_value = prod_insert
            return m
        elif name == "product_variants":
            m.insert.return_value = var_insert
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        response = client.post(
            "/api/admin/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Shampoo Profesional Keratina",
                "category_id": str(uuid4()),
                "brand_id": str(uuid4()),
                "base_price": 5000.0,
                "variants": [
                    {
                        "sku": "SHAMP-KER-500",
                        "variant_name": "500ml",
                        "stock": 15,
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == prod_id
        assert data["name"] == "Shampoo Profesional Keratina"
        assert len(data["variants"]) == 1
    finally:
        app.dependency_overrides.clear()


def test_update_product_and_soft_delete():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    prod_id = str(uuid4())

    prod_update = MagicMock()
    prod_update.execute.return_value = MagicMock(
        data=[{"id": prod_id, "name": "Shampoo Editado", "base_price": 6000.0}]
    )

    def table_side_effect(name):
        m = MagicMock()
        if name == "admin_users":
            admin_sel = MagicMock()
            admin_eq = MagicMock()
            admin_eq.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            m.select.return_value = admin_sel
            admin_sel.eq.return_value = admin_eq
            return m
        elif name == "products":
            m.update.return_value = prod_update
            prod_update.eq.return_value = prod_update
            return m
        elif name == "product_variants":
            var_up = MagicMock()
            m.update.return_value = var_up
            var_up.eq.return_value = var_up
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        # Update
        res_put = client.put(
            f"/api/admin/products/{prod_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"base_price": 6000.0},
        )
        assert res_put.status_code == 200

        # Delete
        res_del = client.delete(
            f"/api/admin/products/{prod_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_del.status_code == 200
        assert "desactivado exitosamente" in res_del.json()["message"]
    finally:
        app.dependency_overrides.clear()


def test_update_variant_stock():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    var_id = str(uuid4())

    var_update = MagicMock()
    var_update.execute.return_value = MagicMock(
        data=[{"id": var_id, "stock": 42}]
    )

    def table_side_effect(name):
        m = MagicMock()
        if name == "admin_users":
            admin_sel = MagicMock()
            admin_eq = MagicMock()
            admin_eq.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            m.select.return_value = admin_sel
            admin_sel.eq.return_value = admin_eq
            return m
        elif name == "product_variants":
            m.update.return_value = var_update
            var_update.eq.return_value = var_update
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.patch(
            f"/api/admin/variants/{var_id}/stock",
            headers={"Authorization": f"Bearer {token}"},
            json={"stock": 42},
        )
        assert res.status_code == 200
        assert res.json()["stock"] == 42
    finally:
        app.dependency_overrides.clear()


def test_upload_image_endpoints():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)

    mock_storage_bucket = MagicMock()
    mock_storage_bucket.get_public_url.return_value = "https://supabase.co/storage/v1/object/public/products/img123.webp"
    mock_db.storage.from_.return_value = mock_storage_bucket

    def table_side_effect(name):
        m = MagicMock()
        if name == "admin_users":
            admin_sel = MagicMock()
            admin_eq = MagicMock()
            admin_eq.execute.return_value = MagicMock(
                data=[{"id": TEST_ADMIN_ID, "email": TEST_EMAIL, "name": "Admin"}]
            )
            m.select.return_value = admin_sel
            admin_sel.eq.return_value = admin_eq
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        # 1. Archivo con extensión prohibida -> 400
        bad_file = io.BytesIO(b"fake executable")
        res_bad = client.post(
            "/api/admin/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("malicious.exe", bad_file, "application/x-msdownload")},
        )
        assert res_bad.status_code == 400
        assert "Formatos aceptados" in res_bad.json()["detail"]

        # 2. Archivo válido .webp -> 200
        good_file = io.BytesIO(b"fake webp bytes")
        res_ok = client.post(
            "/api/admin/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("product.webp", good_file, "image/webp")},
        )
        assert res_ok.status_code == 200
        assert "products" in res_ok.json()["url"]
    finally:
        app.dependency_overrides.clear()
