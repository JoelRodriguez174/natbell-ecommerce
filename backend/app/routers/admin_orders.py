from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.admin_orders import AdminOrderStatusUpdate
from app.services.admin_order_service import AdminOrderService

router = APIRouter(prefix="/api/admin/orders", tags=["Admin Orders"])


@router.get(
    "",
    summary="Listar órdenes con filtros y paginación",
)
async def list_orders(
    status: Optional[str] = Query(None, description="Filtrar por estado: pending, paid, shipped, delivered, cancelled"),
    search: Optional[str] = Query(None, description="Búsqueda por order_number o datos de cliente"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Resultados por página"),
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminOrderService(db)
    return await service.list_orders(status=status, search=search, page=page, per_page=per_page)


@router.get(
    "/{order_number}",
    summary="Obtener detalle completo de un pedido",
)
async def get_order_detail(
    order_number: str,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminOrderService(db)
    try:
        return await service.get_order_detail(order_number)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/{order_number}/status",
    summary="Actualizar estado operativo del pedido",
)
async def update_order_status(
    order_number: str,
    payload: AdminOrderStatusUpdate,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminOrderService(db)
    try:
        return await service.update_order_status(order_number, payload)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error actualizando orden: {exc}")


@router.post(
    "/{order_number}/generate-andreani-shipment",
    summary="Generar etiqueta/código de seguimiento con Andreani PyME",
)
async def generate_andreani_shipment(
    order_number: str,
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    service = AdminOrderService(db)
    try:
        return await service.generate_andreani_shipment(order_number)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error generando envío en Andreani: {exc}")

