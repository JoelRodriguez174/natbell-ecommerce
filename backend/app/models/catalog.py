from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.product import ProductVariant


class PaginationMetadata(BaseModel):
    """Metadatos de paginación calculados por el backend."""
    page: int = Field(..., ge=1)
    per_page: int = Field(..., ge=1, le=50)
    total_items: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    has_next: bool
    has_prev: bool


class ProductFilters(BaseModel):
    """Filtros y opciones de paginación para el catálogo con defensas anti-DoS."""
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=50)
    category: Optional[str] = Field(default=None, max_length=120)
    subcategory: Optional[str] = Field(default=None, max_length=120)
    brand: Optional[str] = Field(default=None, max_length=120)
    min_price: Optional[Decimal] = Field(default=None, ge=Decimal("0.00"))
    max_price: Optional[Decimal] = Field(default=None, ge=Decimal("0.00"))
    sort: Optional[str] = Field(
        default=None,
        pattern="^(price_asc|price_desc|newest|featured)$",
    )
    on_sale: Optional[bool] = Field(
        default=None,
        description="Filtrar exclusivamente productos en oferta",
    )
    search: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Búsqueda por coincidencia de texto en nombre o descripción",
    )


class ProductListItem(BaseModel):
    """Representación optimizada de un producto para listados y tarjetas de catálogo."""
    id: UUID
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    base_price: Decimal = Field(..., gt=Decimal("0.00"))
    sale_price: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"))
    is_on_sale: bool = False
    is_featured: bool = False
    image_urls: List[str] = Field(default_factory=list)
    brand_name: Optional[str] = None
    brand_slug: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    min_price: Decimal = Field(..., gt=Decimal("0.00"))
    max_price: Decimal = Field(..., gt=Decimal("0.00"))
    in_stock: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(BaseModel):
    """Vista detallada de un producto con variantes completas para la página de producto."""
    id: UUID
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    description: Optional[str] = None
    base_price: Decimal = Field(..., gt=Decimal("0.00"))
    sale_price: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"))
    is_on_sale: bool = False
    is_featured: bool = False
    image_urls: List[str] = Field(default_factory=list)
    brand_id: Optional[UUID] = None
    brand_name: Optional[str] = None
    brand_slug: Optional[str] = None
    subcategory_id: Optional[UUID] = None
    subcategory_name: Optional[str] = None
    subcategory_slug: Optional[str] = None
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    variants: List[ProductVariant] = Field(default_factory=list)
    min_price: Decimal = Field(..., gt=Decimal("0.00"))
    max_price: Decimal = Field(..., gt=Decimal("0.00"))
    in_stock: bool = False

    model_config = ConfigDict(from_attributes=True)


class PaginatedProductsResponse(BaseModel):
    """Respuesta estándar para endpoints paginados de catálogo."""
    items: List[ProductListItem]
    pagination: PaginationMetadata
