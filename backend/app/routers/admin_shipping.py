from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.admin_orders import (
    AdminShippingZoneCreate,
    AdminShippingZoneUpdate,
)
from app.services.admin_order_service import AdminShippingService

router = APIRouter(prefix="/api/admin/shipping", tags=["Admin Shipping"])


@router.get(
    "/zones",
    summary="Listar todas las zonas tarifarias de envío",
)
async def list_shipping_zones(
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> List[Dict[str, Any]]:
    service = AdminShippingService(db)
    return await service.list_zones()


@router.post(
    "/zones",
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva zona tarifaria de envío",
)
async def create_shipping_zone(
    payload: AdminShippingZoneCreate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminShippingService(db)
    try:
        return await service.create_zone(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creando zona de envío: {exc}",
        )


@router.put(
    "/zones/{zone_id}",
    summary="Actualizar tarifa o configuración de zona de envío",
)
async def update_shipping_zone(
    zone_id: UUID,
    payload: AdminShippingZoneUpdate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminShippingService(db)
    try:
        return await service.update_zone(zone_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error actualizando zona de envío: {exc}",
        )
