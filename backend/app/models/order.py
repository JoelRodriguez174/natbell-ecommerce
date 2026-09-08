from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class OrderItemCreate(BaseModel):
    product_variant_id: UUID
    quantity: int = Field(..., gt=0)


class CreateOrderRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=6, max_length=30)
    shipping_address: str = Field(..., min_length=5, max_length=300)
    shipping_city: str = Field(..., min_length=2, max_length=100)
    shipping_province: str = Field(..., min_length=2, max_length=100)
    shipping_postal_code: str = Field(..., min_length=2, max_length=10)
    items: List[OrderItemCreate] = Field(..., min_items=1)
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_variant_id: Optional[UUID] = None
    product_name: str
    variant_name: str
    sku: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    status: str
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_province: str
    shipping_postal_code: str
    shipping_cost: Decimal
    subtotal: Decimal
    total: Decimal
    notes: Optional[str] = None
    items: List[OrderItemResponse] = Field(default_factory=list)
    init_point: Optional[str] = None  # MercadoPago Checkout Pro URL
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusResponse(BaseModel):
    order_number: str
    status: str
    customer_name: str
    total: Decimal
    shipping_cost: Decimal
    items_count: int
    created_at: Optional[datetime] = None
    payment_status: Optional[str] = None
