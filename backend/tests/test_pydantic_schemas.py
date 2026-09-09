from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.models.category import CategoryCreate, SubcategoryCreate
from app.models.brand import BrandCreate
from app.models.product import ProductCreate, ProductVariantCreate
from app.models.order import OrderCreate, OrderItemCreate, OrderStatus
from app.models.shipping import ShippingZoneCreate, PostalCodeRange


def test_category_schema_validation():
    # Caso válido
    cat = CategoryCreate(name="Coloración", slug="coloracion", display_order=1)
    assert cat.name == "Coloración"
    assert cat.slug == "coloracion"

    # Caso inválido: nombre vacío
    with pytest.raises(ValidationError):
        CategoryCreate(name="", slug="coloracion")


def test_brand_schema_validation():
    brand = BrandCreate(name="Nov", slug="nov")
    assert brand.name == "Nov"
    assert brand.is_active is True

    # Slug requerido
    with pytest.raises(ValidationError):
        BrandCreate(name="Nov", slug="")


def test_product_and_variant_schema_validation():
    # Variante válida
    variant = ProductVariantCreate(
        sku="NOV-TINT-60",
        variant_name="60ml - 7.1 Rubio Ceniza",
        price_override=Decimal("4500.00"),
        stock=15,
    )
    assert variant.stock == 15

    # Variante inválida: stock negativo
    with pytest.raises(ValidationError):
        ProductVariantCreate(
            sku="NOV-TINT-60",
            variant_name="60ml",
            stock=-1,
        )

    # Variante inválida: precio override <= 0
    with pytest.raises(ValidationError):
        ProductVariantCreate(
            sku="NOV-TINT-60",
            variant_name="60ml",
            price_override=Decimal("-100"),
            stock=5,
        )

    # Producto base válido
    prod = ProductCreate(
        name="Tintura Profesional en Crema",
        slug="tintura-profesional-en-crema",
        subcategory_id="b63f5f8b-3e5f-4a6f-9988-5c4d12345678",
        brand_id="a12f5f8b-3e5f-4a6f-9988-5c4d12345678",
        base_price=Decimal("4200.50"),
        variants=[variant],
    )
    assert prod.base_price == Decimal("4200.50")
    assert len(prod.variants) == 1

    # Producto inválido: precio base <= 0
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Tintura",
            slug="tintura",
            subcategory_id="b63f5f8b-3e5f-4a6f-9988-5c4d12345678",
            brand_id="a12f5f8b-3e5f-4a6f-9988-5c4d12345678",
            base_price=Decimal("0.00"),
        )


def test_order_schema_validation():
    item = OrderItemCreate(
        product_name="Tintura Nov",
        variant_name="60ml",
        sku="NOV-60",
        quantity=2,
        unit_price=Decimal("4500.00"),
        subtotal=Decimal("9000.00"),
    )
    assert item.quantity == 2

    # Item inválido: cantidad <= 0
    with pytest.raises(ValidationError):
        OrderItemCreate(
            product_name="Tintura",
            variant_name="60ml",
            sku="NOV-60",
            quantity=0,
            unit_price=Decimal("4500.00"),
            subtotal=Decimal("0.00"),
        )

    # Orden válida
    order = OrderCreate(
        customer_name="Juan Perez",
        customer_email="juan@example.com",
        customer_phone="+5491112345678",
        shipping_address="Av. Corrientes 1234",
        shipping_city="CABA",
        shipping_province="Buenos Aires",
        shipping_postal_code="1043",
        shipping_cost=Decimal("3500.00"),
        subtotal=Decimal("9000.00"),
        total=Decimal("12500.00"),
        items=[item],
    )
    assert order.status == OrderStatus.PENDING
    assert order.total == Decimal("12500.00")

    # Orden inválida: email inválido
    with pytest.raises(ValidationError):
        OrderCreate(
            customer_name="Juan",
            customer_email="email-invalido",
            customer_phone="123",
            shipping_address="Calle 1",
            shipping_city="CABA",
            shipping_province="BA",
            shipping_postal_code="1000",
            shipping_cost=Decimal("1000.00"),
            subtotal=Decimal("1000.00"),
            total=Decimal("2000.00"),
            items=[item],
        )


def test_shipping_zone_validation():
    # Zona válida
    zone = ShippingZoneCreate(
        zone_name="CABA",
        postal_code_ranges=[PostalCodeRange(from_code="1000", to_code="1499")],
        cost=Decimal("3500.00"),
        estimated_days=2,
    )
    assert zone.zone_name == "CABA"
    assert zone.cost == Decimal("3500.00")

    # Zona inválida: costo negativo o días <= 0
    with pytest.raises(ValidationError):
        ShippingZoneCreate(
            zone_name="CABA",
            postal_code_ranges=[PostalCodeRange(from_code="1000", to_code="1499")],
            cost=Decimal("-500.00"),
            estimated_days=2,
        )
