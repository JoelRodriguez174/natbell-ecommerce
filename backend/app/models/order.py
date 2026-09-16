from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Union
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAYMENT_PENDING = "payment_pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


# ==========================================
# Items del Pedido
# ==========================================

class OrderItemBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    variant_name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=Decimal("0.00"))
    subtotal: Decimal = Field(..., gt=Decimal("0.00"))


class OrderItemCreate(OrderItemBase):
    product_variant_id: Optional[Union[UUID, str]] = None


class OrderItem(OrderItemBase):
    id: UUID
    order_id: UUID
    product_variant_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCheckoutItem(BaseModel):
    """Item simplificado enviado desde el formulario de checkout."""
    product_variant_id: Union[UUID, str]
    quantity: int = Field(..., gt=0)


# ==========================================
# Pedidos (Orders)
# ==========================================

class OrderBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=150)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=1, max_length=30)
    shipping_address: str = Field(..., min_length=1, max_length=300)
    shipping_city: str = Field(..., min_length=1, max_length=100)
    shipping_province: str = Field(..., min_length=1, max_length=100)
    shipping_postal_code: str = Field(..., min_length=1, max_length=10)
    shipping_cost: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    subtotal: Decimal = Field(..., gt=Decimal("0.00"))
    total: Decimal = Field(..., gt=Decimal("0.00"))
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    status: OrderStatus = OrderStatus.PENDING
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderCheckoutRequest(BaseModel):
    """Payload recibido del cliente en POST /api/orders (Anti-Tampering)."""
    customer_name: str = Field(..., min_length=1, max_length=150)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=1, max_length=30)
    shipping_address: str = Field(..., min_length=1, max_length=300)
    shipping_city: str = Field(..., min_length=1, max_length=100)
    shipping_province: str = Field(..., min_length=1, max_length=100)
    shipping_postal_code: str = Field(..., min_length=1, max_length=10)
    shipping_cost: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    notes: Optional[str] = None
    items: List[OrderCheckoutItem] = Field(..., min_length=1)


class Order(OrderBase):
    id: UUID
    order_number: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OrderCreateResponse(BaseModel):
    """Respuesta tras la creación exitosa del pedido."""
    order_id: UUID
    order_number: str
    status: OrderStatus
    subtotal: Decimal
    shipping_cost: Decimal
    total: Decimal
    checkout_url: str
    mp_preference_id: Optional[str] = None


class OrderStatusResponse(BaseModel):
    """Respuesta pública para el tracking del pedido en /pedido/[orderNumber]."""
    order_number: str
    status: OrderStatus
    customer_name: str
    customer_email: EmailStr
    shipping_address: str
    shipping_city: str
    shipping_province: str
    shipping_postal_code: str
    shipping_cost: Decimal
    subtotal: Decimal
    total: Decimal
    created_at: datetime
    items: List[OrderItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Pagos y Preferencias de Pasarela
# ==========================================

class PaymentPreferenceResult(BaseModel):
    preference_id: str
    init_point: str
    sandbox_init_point: Optional[str] = None


class PaymentRecord(BaseModel):
    id: UUID
    order_id: UUID
    mp_preference_id: Optional[str] = None
    mp_payment_id: Optional[str] = None
    mp_status: Optional[str] = None
    mp_status_detail: Optional[str] = None
    amount: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
