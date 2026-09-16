from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.catalog import (
    PaginationMetadata,
    ProductFilters,
    ProductListItem,
)


def test_pagination_metadata_calculation():
    meta = PaginationMetadata(
        page=2,
        per_page=20,
        total_items=45,
        total_pages=3,
        has_next=True,
        has_prev=True,
    )
    assert meta.total_pages == 3
    assert meta.has_next is True
    assert meta.has_prev is True


def test_product_filters_validation():
    # Filtros válidos por defecto
    filters = ProductFilters()
    assert filters.page == 1
    assert filters.per_page == 20

    # Límite superior defensivo (max 50)
    filters_custom = ProductFilters(page=2, per_page=50, sort="price_asc")
    assert filters_custom.per_page == 50

    # Rechazo si per_page excede el máximo permitido (defensa contra DoS por memoria)
    with pytest.raises(ValidationError):
        ProductFilters(per_page=100)

    # Rechazo si precios son negativos
    with pytest.raises(ValidationError):
        ProductFilters(min_price=Decimal("-10.00"))

    # Soporte para filtro de ofertas
    filters_sale = ProductFilters(on_sale=True)
    assert filters_sale.on_sale is True
    assert ProductFilters().on_sale is None


def test_product_list_item_schema():
    item = ProductListItem(
        id="b63f5f8b-3e5f-4a6f-9988-5c4d12345678",
        name="Tintura Profesional",
        slug="tintura-profesional",
        base_price=Decimal("4500.00"),
        sale_price=None,
        is_on_sale=False,
        is_featured=True,
        image_urls=["https://example.com/img1.jpg"],
        brand_name="Nov",
        brand_slug="nov",
        category_name="Coloración",
        category_slug="coloracion",
        min_price=Decimal("4500.00"),
        max_price=Decimal("5200.00"),
        in_stock=True,
    )
    assert item.name == "Tintura Profesional"
    assert item.in_stock is True
    assert item.min_price == Decimal("4500.00")
