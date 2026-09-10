"""Módulo de modelos y contratos Pydantic para Los Arrayanes E-commerce."""

from app.models.category import Category, CategoryCreate, Subcategory, SubcategoryCreate
from app.models.brand import Brand, BrandCreate
from app.models.product import (
    Product,
    ProductCreate,
    ProductVariant,
    ProductVariantCreate,
)
from app.models.order import Order, OrderCreate, OrderItem, OrderItemCreate, OrderStatus
from app.models.shipping import ShippingZone, ShippingZoneCreate, PostalCodeRange
from app.models.catalog import (
    PaginationMetadata,
    ProductFilters,
    ProductListItem,
    ProductDetailResponse,
    PaginatedProductsResponse,
)

__all__ = [
    "Category",
    "CategoryCreate",
    "Subcategory",
    "SubcategoryCreate",
    "Brand",
    "BrandCreate",
    "Product",
    "ProductCreate",
    "ProductVariant",
    "ProductVariantCreate",
    "Order",
    "OrderCreate",
    "OrderItem",
    "OrderItemCreate",
    "OrderStatus",
    "ShippingZone",
    "ShippingZoneCreate",
    "PostalCodeRange",
    "PaginationMetadata",
    "ProductFilters",
    "ProductListItem",
    "ProductDetailResponse",
    "PaginatedProductsResponse",
]
