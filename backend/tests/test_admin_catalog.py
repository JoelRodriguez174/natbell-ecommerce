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
            prod_del = MagicMock()
            m.delete.return_value = prod_del
            prod_del.eq.return_value = prod_del
            prod_del.in_.return_value = prod_del
            return m
        elif name == "product_variants":
            var_up = MagicMock()
            m.update.return_value = var_up
            var_up.eq.return_value = var_up
            var_del = MagicMock()
            m.delete.return_value = var_del
            var_del.eq.return_value = var_del
            var_del.in_.return_value = var_del
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
        assert "eliminado exitosamente" in res_del.json()["message"]

        # Bulk Delete
        res_bulk = client.post(
            "/api/admin/products/bulk-delete",
            headers={"Authorization": f"Bearer {token}"},
            json={"product_ids": [prod_id]},
        )
        assert res_bulk.status_code == 200
        assert "eliminados exitosamente" in res_bulk.json()["message"]
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


def test_create_product_with_subcategory_id_directly():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)

    prod_id = str(uuid4())
    subcat_id = str(uuid4())

    slug_select = MagicMock()
    slug_eq = MagicMock()
    slug_eq.execute.return_value = MagicMock(data=[])

    prod_insert = MagicMock()
    prod_insert.execute.return_value = MagicMock(
        data=[
            {
                "id": prod_id,
                "name": "Acondicionador Restaurador",
                "slug": "acondicionador-restaurador",
                "subcategory_id": subcat_id,
                "base_price": 4500.0,
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
            admin_sel.eq.return_value = admin_eq
            m.select.return_value = admin_sel
            return m
        if name == "products":
            m.select.return_value = slug_select
            slug_select.eq.return_value = slug_eq
            m.insert.return_value = prod_insert
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.post(
            "/api/admin/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Acondicionador Restaurador",
                "subcategory_id": subcat_id,
                "brand_id": str(uuid4()),
                "base_price": 4500.0,
            },
        )
        assert res.status_code == 201
        assert res.json()["id"] == prod_id
    finally:
        app.dependency_overrides.clear()


def test_create_product_missing_categories_fails():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    try:
        res = client.post(
            "/api/admin/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Acondicionador Sin Categoria",
                "brand_id": str(uuid4()),
                "base_price": 4500.0,
            },
        )
        assert res.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_admin_catalog_mutations_invalidate_cache():
    from app.utils.cache import global_cache

    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    prod_id = str(uuid4())

    prod_update = MagicMock()
    prod_update.execute.return_value = MagicMock(
        data=[{"id": prod_id, "name": "Shampoo Invalida Cache", "base_price": 7000.0}]
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
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        # Pre-poblar caché con prefijo 'catalog:'
        global_cache.set("catalog:products:test_key", {"items": []})
        assert global_cache.get("catalog:products:test_key") is not None

        # Realizar mutación vía PUT
        res_put = client.put(
            f"/api/admin/products/{prod_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"base_price": 7000.0},
        )
        assert res_put.status_code == 200

        # Verificar que la entrada de caché fue invalidada
        assert global_cache.get("catalog:products:test_key") is None
    finally:
        app.dependency_overrides.clear()


def test_delete_product_removes_supabase_storage_images():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    prod_id = str(uuid4())

    mock_storage = MagicMock()
    mock_db.storage.from_.return_value = mock_storage

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
            # select image_urls before delete
            sel_mock = MagicMock()
            eq_mock = MagicMock()
            eq_mock.limit.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": prod_id,
                        "image_urls": [
                            "https://abc.supabase.co/storage/v1/object/public/products/img_test_123.webp",
                            "https://images.unsplash.com/photo-12345678",  # external URL, must NOT be sent to storage
                            "/products/img_local_456.png",
                        ],
                    }
                ]
            )
            sel_mock.eq.return_value = eq_mock
            m.select.return_value = sel_mock
            # delete
            del_mock = MagicMock()
            del_mock.eq.return_value.execute.return_value = MagicMock(data=[])
            m.delete.return_value = del_mock
            return m
        elif name == "product_variants":
            del_mock = MagicMock()
            del_mock.eq.return_value.execute.return_value = MagicMock(data=[])
            m.delete.return_value = del_mock
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.delete(
            f"/api/admin/products/{prod_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        # Verify storage remove was called with only internal images
        mock_db.storage.from_.assert_called_with("products")
        mock_storage.remove.assert_called_once()
        removed_paths = mock_storage.remove.call_args[0][0]
        assert "img_test_123.webp" in removed_paths
        assert "img_local_456.png" in removed_paths
        assert not any("unsplash" in p for p in removed_paths)
    finally:
        app.dependency_overrides.clear()


def test_bulk_delete_products_removes_supabase_storage_images():
    mock_db = _setup_admin_override()
    token = create_access_token(subject=TEST_ADMIN_ID)
    prod_id_1 = str(uuid4())
    prod_id_2 = str(uuid4())

    mock_storage = MagicMock()
    mock_db.storage.from_.return_value = mock_storage

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
            # select image_urls before delete
            sel_mock = MagicMock()
            in_mock = MagicMock()
            in_mock.execute.return_value = MagicMock(
                data=[
                    {
                        "id": prod_id_1,
                        "image_urls": ["https://xyz.supabase.co/storage/v1/object/public/products/prod1_img.webp"],
                    },
                    {
                        "id": prod_id_2,
                        "image_urls": ["/products/prod2_img.jpg"],
                    },
                ]
            )
            sel_mock.in_.return_value = in_mock
            m.select.return_value = sel_mock
            # delete
            del_mock = MagicMock()
            del_mock.in_.return_value.execute.return_value = MagicMock(data=[])
            m.delete.return_value = del_mock
            return m
        elif name == "product_variants":
            del_mock = MagicMock()
            del_mock.in_.return_value.execute.return_value = MagicMock(data=[])
            m.delete.return_value = del_mock
            return m
        return m

    mock_db.table.side_effect = table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        res = client.post(
            "/api/admin/products/bulk-delete",
            headers={"Authorization": f"Bearer {token}"},
            json={"product_ids": [prod_id_1, prod_id_2]},
        )
        assert res.status_code == 200
        assert res.json()["count"] == 2
        mock_storage.remove.assert_called_once()
        removed_paths = mock_storage.remove.call_args[0][0]
        assert "prod1_img.webp" in removed_paths
        assert "prod2_img.jpg" in removed_paths
    finally:
        app.dependency_overrides.clear()



