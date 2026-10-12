from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_percent: int = Field(..., ge=1, le=100)
    is_active: bool = True
    max_uses: Optional[int] = Field(default=None, gt=0)
    expires_at: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("El código de cupón no puede estar vacío.")
        return clean


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    is_active: Optional[bool] = None
    max_uses: Optional[int] = Field(default=None, gt=0)
    expires_at: Optional[datetime] = None


class CouponResponse(CouponBase):
    id: UUID
    times_used: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("El código no puede estar vacío.")
        return clean


class CouponValidateResponse(BaseModel):
    valid: bool = True
    code: str
    discount_percent: int
