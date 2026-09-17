"""Módulo de modelos y contratos Pydantic para Los Arrayanes E-commerce."""

from app.models.admin import AdminLoginRequest, AdminLoginResponse, AdminUserResponse
from app.models.admin_catalog import (
    AdminProductCreate,
    AdminProductUpdate,
    AdminStockUpdate,
    AdminUploadResponse,
    AdminVariantCreate,
    AdminVariantUpdate,
)
from app.models.admin_dashboard import (
    AdminDashboardMetricsResponse,
    LowStockVariantItem,
    RecentOrderItem,
)
from app.models.admin_orders import (
    AdminOrderStatusUpdate,
    AdminShippingZoneCreate,
    AdminShippingZoneUpdate,
)
from app.models.brand import Brand, BrandCreate
from app.models.catalog import (
    PaginatedProductsResponse,
    PaginationMetadata,
    ProductDetailResponse,
    ProductFilters,
    ProductListItem,
)
from app.models.category import Category, CategoryCreate, Subcategory, SubcategoryCreate
from app.models.order import Order, OrderCreate, OrderItem, OrderItemCreate, OrderStatus
from app.models.product import (
    Product,
    ProductCreate,
    ProductVariant,
    ProductVariantCreate,
)
from app.models.shipping import PostalCodeRange, ShippingZone, ShippingZoneCreate

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
    "AdminLoginRequest",
    "AdminUserResponse",
    "AdminLoginResponse",
    "AdminProductCreate",
    "AdminProductUpdate",
    "AdminVariantCreate",
    "AdminVariantUpdate",
    "AdminStockUpdate",
    "AdminUploadResponse",
    "AdminOrderStatusUpdate",
    "AdminShippingZoneCreate",
    "AdminShippingZoneUpdate",
    "AdminDashboardMetricsResponse",
    "LowStockVariantItem",
    "RecentOrderItem",
]
