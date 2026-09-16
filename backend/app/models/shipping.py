from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PostalCodeRange(BaseModel):
    from_code: str = Field(..., alias="from")
    to_code: str = Field(..., alias="to")

    model_config = ConfigDict(populate_by_name=True)


class ShippingZoneBase(BaseModel):
    zone_name: str = Field(..., min_length=1, max_length=100)
    postal_code_ranges: List[PostalCodeRange] = Field(default_factory=list)
    cost: Decimal = Field(..., ge=Decimal("0.00"))
    estimated_days: int = Field(..., gt=0)
    is_active: bool = True


class ShippingZoneCreate(ShippingZoneBase):
    pass


class ShippingZone(ShippingZoneBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShippingQuote(BaseModel):
    zone_name: str
    cost: Decimal
    estimated_days: int
    postal_code: str
    provider: str = "fixed_rate"
    description: str

