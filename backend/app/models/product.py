from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------
# Subcategory Schemas
# ---------------------------------------------------------
class SubcategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class SubcategoryResponse(SubcategoryBase):
    id: UUID
    category_id: UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Category Schemas
# ---------------------------------------------------------
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: Optional[datetime] = None
    subcategories: List[SubcategoryResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Brand Schemas
# ---------------------------------------------------------
class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    is_active: bool = True


class BrandResponse(BrandBase):
    id: UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Variant Schemas
# ---------------------------------------------------------
class VariantBase(BaseModel):
    sku: str
    variant_name: str
    price_override: Optional[Decimal] = None
    stock: int = Field(default=0, ge=0)
    is_active: bool = True


class VariantResponse(VariantBase):
    id: UUID
    product_id: UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Product Schemas
# ---------------------------------------------------------
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    base_price: Decimal = Field(..., gt=0)
    is_featured: bool = False
    is_on_sale: bool = False
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
    image_urls: List[str] = Field(default_factory=list)
    is_active: bool = True


class ProductResponse(ProductBase):
    id: UUID
    subcategory_id: UUID
    brand_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    brand: Optional[BrandResponse] = None
    subcategory: Optional[SubcategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    variants: List[VariantResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
