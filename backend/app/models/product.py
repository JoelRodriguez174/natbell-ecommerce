from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ProductVariantBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50)
    variant_name: str = Field(..., min_length=1, max_length=100)
    price_override: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"))
    stock: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    product_id: Optional[Union[UUID, str]] = None


class ProductVariant(ProductVariantBase):
    id: UUID
    product_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    description: Optional[str] = None
    base_price: Decimal = Field(..., gt=Decimal("0.00"))
    is_featured: bool = False
    is_on_sale: bool = False
    sale_price: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"))
    image_urls: List[str] = Field(default_factory=list)
    is_active: bool = True


class ProductCreate(ProductBase):
    subcategory_id: Union[UUID, str]
    brand_id: Union[UUID, str]
    variants: List[ProductVariantCreate] = Field(default_factory=list)


class Product(ProductBase):
    id: UUID
    subcategory_id: UUID
    brand_id: UUID
    created_at: datetime
    updated_at: datetime
    variants: List[ProductVariant] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
