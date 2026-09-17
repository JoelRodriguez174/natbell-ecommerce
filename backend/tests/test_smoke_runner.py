import sys
from pathlib import Path
from unittest.mock import MagicMock
from uuid import uuid4

from starlette.testclient import TestClient

from app.database import get_supabase_client
from app.main import app

# Asegurar que scripts/ esté en path para importar SmokeTestRunner
SCRIPTS_DIR = Path(__file__).resolve().parent.parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from smoke_test_production import SmokeTestRunner  # noqa: E402


def test_smoke_runner_direct_with_test_client():
    mock_db = MagicMock()

    cat_id = str(uuid4())
    cats_data = [
        {
            "id": cat_id,
            "name": "Coloración",
            "slug": "coloracion",
            "display_order": 1,
            "is_active": True,
            "created_at": "2026-09-01T00:00:00Z",
        }
    ]
    brands_data = [
        {
            "id": str(uuid4()),
            "name": "Nov",
            "slug": "nov",
            "is_active": True,
            "created_at": "2026-09-01T00:00:00Z",
        }
    ]
    subcats_data = []

    prod_id = str(uuid4())
    prods_data = [
        {
            "id": prod_id,
            "name": "Tintura Profesional",
            "slug": "tintura-profesional",
            "base_price": 5000.0,
            "is_active": True,
            "category_name": "Coloración",
            "brand_name": "Nov",
            "image_urls": [],
            "variants": [],
        }
    ]

    def table_router(table_name):
        m = MagicMock()
        if table_name == "categories":
            s = MagicMock()
            eq_mock = MagicMock()
            ord_mock = MagicMock()
            ord_mock.execute.return_value = MagicMock(data=cats_data)
            eq_mock.order.return_value = ord_mock
            s.eq.return_value = eq_mock
            m.select.return_value = s
            return m
        elif table_name == "subcategories":
            s = MagicMock()
            eq_mock = MagicMock()
            ord_mock = MagicMock()
            ord_mock.execute.return_value = MagicMock(data=subcats_data)
            eq_mock.order.return_value = ord_mock
            s.eq.return_value = eq_mock
            m.select.return_value = s
            return m
        elif table_name == "brands":
            s = MagicMock()
            eq_mock = MagicMock()
            ord_mock = MagicMock()
            ord_mock.execute.return_value = MagicMock(data=brands_data)
            eq_mock.order.return_value = ord_mock
            s.eq.return_value = eq_mock
            m.select.return_value = s
            return m
        elif table_name == "products":
            s = MagicMock()
            s.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(
                data=prods_data, count=1
            )
            m.select.return_value = s
            return m
        return m

    mock_db.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_db

    try:
        runner = SmokeTestRunner(base_url="http://testserver")
        with TestClient(app, base_url="http://testserver") as client:
            runner._test_root(client)
            runner._test_health_check(client)
            runner._test_security_headers(client)
            runner._test_cors_preflight(client)
            runner._test_catalog_taxonomies(client)
            runner._test_catalog_products(client)
            runner._test_shipping_quote(client)
            runner._test_admin_security_lockdown(client)

        failures = [f for f in runner.results if not f[1]]
        assert len(failures) == 0, f"Fallaron pruebas: {failures}"
        assert len(runner.results) == 8
    finally:
        app.dependency_overrides.clear()
