import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends
from supabase import Client

from app.database import get_supabase_client
from app.models.coupon import CouponValidateRequest, CouponValidateResponse
from app.services.coupon_service import CouponService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])


@router.post(
    "/validate",
    response_model=CouponValidateResponse,
    summary="Validar cupón de descuento",
)
def validate_coupon(
    payload: CouponValidateRequest,
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """Valida un código de cupón para el carrito o checkout y retorna el porcentaje de descuento si es válido."""
    service = CouponService(db_client=db)
    coupon = service.validate_coupon(payload.code, customer_email=payload.customer_email)
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_percent": int(coupon["discount_percent"]),
    }
