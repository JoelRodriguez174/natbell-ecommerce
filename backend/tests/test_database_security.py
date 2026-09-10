from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.models.category import CategoryCreate
from app.models.product import ProductCreate, ProductVariantCreate
from app.models.order import OrderCreate, OrderItemCreate


def test_sql_injection_defense_in_pydantic_slugs():
    """
    Verifica que intentos de inyección SQL en slugs y nombres no eludan
    las validaciones de tipado y constraints de esquemas Pydantic.
    """
    malicious_slugs = [
        "nov'; DROP TABLE products; --",
        "../../etc/passwd",
        "category' OR '1'='1",
        "<script>alert('xss')</script>",
    ]
    for slug in malicious_slugs:
        # Los slugs deben ser cadenas válidas y no deben romper la instanciación;
        # el backend utilizará parámetros seguros (Prepared Statements / PostgREST)
        # sin concatenación cruda de SQL.
        cat = CategoryCreate(name="Safe Name", slug=slug)
        assert cat.slug == slug


def test_extreme_input_lengths_resilience():
    """
    Verifica resiliencia contra ataques de denegación de servicio por memoria
    (payloads con cadenas masivas que exceden max_length).
    """
    massive_name = "A" * 5000
    with pytest.raises(ValidationError):
        CategoryCreate(name=massive_name, slug="safe-slug")


def test_negative_numeric_tampering_defense():
    """
    Prueba de penetración defensiva: verificación de que valores numéricos
    negativos, cero o anómalos son rechazados inmediatamente por los modelos de dominio.
    """
    # 1. Intento de variantes con precios negativos o stock negativo
    with pytest.raises(ValidationError):
        ProductVariantCreate(
            sku="HACK-01",
            variant_name="Free Variant",
            price_override=Decimal("-99999.99"),
            stock=10,
        )

    with pytest.raises(ValidationError):
        ProductVariantCreate(
            sku="HACK-02",
            variant_name="Negative Stock",
            stock=-999,
        )

    # 2. Intento de ítems de pedido con precios negativos o cantidad cero
    with pytest.raises(ValidationError):
        OrderItemCreate(
            product_name="Hack Product",
            variant_name="Standard",
            sku="HACK-03",
            quantity=-1,
            unit_price=Decimal("100.00"),
            subtotal=Decimal("-100.00"),
        )

    with pytest.raises(ValidationError):
        OrderItemCreate(
            product_name="Hack Product",
            variant_name="Standard",
            sku="HACK-04",
            quantity=1,
            unit_price=Decimal("-5000.00"),
            subtotal=Decimal("-5000.00"),
        )


def test_order_tampering_total_calculation():
    """
    Verifica que los modelos de orden mantengan la consistencia y no acepten
    subtotales o costos de envío negativos.
    """
    item = OrderItemCreate(
        product_name="Tratamiento Capilar",
        variant_name="500ml",
        sku="NOV-TRAT-500",
        quantity=1,
        unit_price=Decimal("8500.00"),
        subtotal=Decimal("8500.00"),
    )

    # Costo de envío negativo (tampering)
    with pytest.raises(ValidationError):
        OrderCreate(
            customer_name="Atacante",
            customer_email="attacker@exploit.com",
            customer_phone="12345678",
            shipping_address="Calle Falsa 123",
            shipping_city="CABA",
            shipping_province="Buenos Aires",
            shipping_postal_code="1000",
            shipping_cost=Decimal("-1000.00"),  # Inválido
            subtotal=Decimal("8500.00"),
            total=Decimal("7500.00"),
            items=[item],
        )
