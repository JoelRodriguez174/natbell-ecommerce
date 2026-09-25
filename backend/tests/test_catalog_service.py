from decimal import Decimal
from uuid import uuid4

from app.services.catalog_service import CatalogService


def test_map_product_to_list_item_price_range_and_stock():
    prod_id = uuid4()
    mock_data = {
        "id": prod_id,
        "name": "Shampoo Neutro 1000ml",
        "slug": "shampoo-neutro-1000ml",
        "description": "Shampoo de limpieza profunda",
        "base_price": "3500.00",
        "sale_price": None,
        "is_on_sale": False,
        "is_featured": True,
        "image_urls": ["https://example.com/shampoo.jpg"],
        "brands": {"name": "Nov", "slug": "nov"},
        "subcategories": {
            "name": "Shampoos",
            "slug": "shampoos",
            "categories": {"name": "Tratamientos", "slug": "tratamientos"},
        },
        "product_variants": [
            {
                "id": uuid4(),
                "sku": "NOV-SH-1000",
                "variant_name": "1000ml",
                "price_override": "3800.00",
                "stock": 5,
                "is_active": True,
            },
            {
                "id": uuid4(),
                "sku": "NOV-SH-250",
                "variant_name": "250ml",
                "price_override": "2100.00",
                "stock": 0,
                "is_active": True,
            },
        ],
    }

    item = CatalogService._map_to_list_item(mock_data)
    assert item.name == "Shampoo Neutro 1000ml"
    assert item.brand_name == "Nov"
    assert item.category_name == "Tratamientos"
    # Min price debe ser el menor entre variantes y base (2100.00)
    assert item.min_price == Decimal("2100.00")
    # Max price debe ser el mayor (3800.00)
    assert item.max_price == Decimal("3800.00")
    # Stock disponible si alguna variante tiene stock > 0
    assert item.in_stock is True
    assert item.stock == 5
    assert item.total_stock == 5
    assert len(item.variants) == 2


def test_map_product_to_detail():
    prod_id = uuid4()
    brand_id = uuid4()
    subcat_id = uuid4()
    cat_id = uuid4()

    mock_data = {
        "id": prod_id,
        "name": "Acondicionador Brillo",
        "slug": "acondicionador-brillo",
        "description": "Brillo extremo",
        "base_price": "4000.00",
        "sale_price": "3600.00",
        "is_on_sale": True,
        "is_featured": False,
        "image_urls": [],
        "brand_id": brand_id,
        "subcategory_id": subcat_id,
        "brands": {"name": "Plasma", "slug": "plasma"},
        "subcategories": {
            "name": "Acondicionadores",
            "slug": "acondicionadores",
            "category_id": cat_id,
            "categories": {"id": cat_id, "name": "Cuidado Capilar", "slug": "cuidado-capilar"},
        },
        "product_variants": [],
    }

    detail = CatalogService._map_to_detail(mock_data)
    assert detail.name == "Acondicionador Brillo"
    assert detail.is_on_sale is True
    assert detail.min_price == Decimal("3600.00")
    assert detail.max_price == Decimal("3600.00")
    assert detail.brand_name == "Plasma"
    assert detail.category_slug == "cuidado-capilar"
    assert detail.in_stock is False
