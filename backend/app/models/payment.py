from decimal import Decimal
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PaymentResponse(BaseModel):
    id: UUID
    order_id: UUID
    mp_preference_id: Optional[str] = None
    mp_payment_id: Optional[str] = None
    mp_status: Optional[str] = None
    mp_status_detail: Optional[str] = None
    amount: Decimal
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
