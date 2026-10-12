import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.coupon import CouponCreate, CouponResponse, CouponUpdate
from app.services.coupon_service import CouponService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/coupons", tags=["Admin Coupons"])


@router.get(
    "",
    response_model=List[CouponResponse],
    summary="Listar todos los cupones",
)
def list_coupons(
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> List[Dict[str, Any]]:
    """Obtiene la lista completa de cupones con sus métricas de uso y estado."""
    service = CouponService(db_client=db)
    return service.list_coupons()


@router.post(
    "",
    response_model=CouponResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo cupón",
)
def create_coupon(
    payload: CouponCreate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """Crea un nuevo cupón con validación de código único y rango de porcentaje (1-100%)."""
    service = CouponService(db_client=db)
    return service.create_coupon(payload)


@router.patch(
    "/{coupon_id}/toggle",
    response_model=CouponResponse,
    summary="Alternar estado activo/inactivo del cupón",
)
def toggle_coupon(
    coupon_id: UUID,
    is_active: bool,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """Permite al admin activar o desactivar rápidamente un cupón."""
    service = CouponService(db_client=db)
    return service.toggle_status(coupon_id, is_active)


@router.patch(
    "/{coupon_id}",
    response_model=CouponResponse,
    summary="Actualizar configuración del cupón",
)
def update_coupon(
    coupon_id: UUID,
    payload: CouponUpdate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """Actualiza vigencia, límite de usos o estado del cupón."""
    service = CouponService(db_client=db)
    return service.update_coupon(coupon_id, payload)


@router.delete(
    "/{coupon_id}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar un cupón",
)
def delete_coupon(
    coupon_id: UUID,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """Elimina permanentemente un cupón si ya no se desea utilizar."""
    service = CouponService(db_client=db)
    service.delete_coupon(coupon_id)
    return {"message": "Cupón eliminado correctamente", "id": str(coupon_id)}
