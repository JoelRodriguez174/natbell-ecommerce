from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------------------------------------------------------
# Admin Authentication Schemas
# ---------------------------------------------------------
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUserResponse


# ---------------------------------------------------------
# Admin Product & Variant Schemas
# ---------------------------------------------------------
class AdminProductCreate(BaseModel):
    subcategory_id: UUID
    brand_id: UUID
    name: str = Field(..., min_length=2, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    base_price: Decimal = Field(..., gt=0)
    is_featured: bool = False
    is_on_sale: bool = False
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
    image_urls: List[str] = Field(default_factory=list)
    is_active: bool = True


class AdminProductUpdate(BaseModel):
    subcategory_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = Field(default=None, gt=0)
    is_featured: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AdminVariantCreate(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    variant_name: str = Field(..., min_length=1, max_length=100)
    price_override: Optional[Decimal] = Field(default=None, gt=0)
    stock: int = Field(default=0, ge=0)
    is_active: bool = True


class AdminVariantUpdate(BaseModel):
    sku: Optional[str] = None
    variant_name: Optional[str] = None
    price_override: Optional[Decimal] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


# ---------------------------------------------------------
# Admin Order & Dashboard Schemas
# ---------------------------------------------------------
class AdminOrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(pending|payment_pending|paid|shipped|delivered|cancelled)$",
    )


class DashboardStatsResponse(BaseModel):
    sales_today: Decimal
    sales_this_week: Decimal
    sales_this_month: Decimal
    pending_orders_count: int
    low_stock_variants_count: int
    recent_orders: List[Dict[str, Any]] = Field(default_factory=list)
