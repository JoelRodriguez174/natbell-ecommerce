from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdminVariantCreate(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    variant_name: str = Field(..., min_length=1, max_length=100)
    price_override: Optional[Decimal] = Field(None, gt=0)
    stock: int = Field(0, ge=0)
    is_active: bool = True


class AdminVariantUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    variant_name: Optional[str] = Field(None, min_length=1, max_length=100)
    price_override: Optional[Decimal] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class AdminProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    category_id: UUID
    brand_id: UUID
    base_price: Decimal = Field(..., gt=0)
    sale_price: Optional[Decimal] = Field(None, gt=0)
    is_on_sale: bool = False
    is_featured: bool = False
    is_active: bool = True
    images: List[str] = Field(default_factory=list)
    variants: List[AdminVariantCreate] = Field(default_factory=list)


class AdminProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    base_price: Optional[Decimal] = Field(None, gt=0)
    sale_price: Optional[Decimal] = Field(None, gt=0)
    is_on_sale: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    images: Optional[List[str]] = None


class AdminStockUpdate(BaseModel):
    stock: int = Field(..., ge=0, description="Nuevo stock de la variante")


class AdminUploadResponse(BaseModel):
    url: str
    filename: str
