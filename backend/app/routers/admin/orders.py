from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.middleware.admin_auth import get_current_admin
from app.models.admin import AdminOrderStatusUpdate
from app.database import supabase

router = APIRouter(
    prefix="/api/admin/orders",
    tags=["Admin Orders"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("")
async def list_admin_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None, description="Search customer name, email, or order number"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    """List customer orders with status filtering, search and pagination."""
    query = supabase.table("orders").select(
        "*, order_items(*), payments(mp_status, mp_payment_id)",
        count="exact",
    )

    if status_filter:
        query = query.eq("status", status_filter)
    if q:
        query = query.or_(
            f"order_number.ilike.%{q}%,customer_name.ilike.%{q}%,customer_email.ilike.%{q}%"
        )

    offset = (page - 1) * per_page
    query = query.order("created_at", desc=True).range(offset, offset + per_page - 1)

    res = query.execute()
    items = res.data or []
    total = res.count if res.count is not None else len(items)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{order_id}")
async def get_admin_order(order_id: UUID):
    """Retrieve full order details including line items, delivery address, and payments."""
    res = (
        supabase.table("orders")
        .select("*, items:order_items(*), payment:payments(*)")
        .eq("id", str(order_id))
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )
    return res.data[0]


@router.patch("/{order_id}/status")
async def update_order_status(order_id: UUID, req: AdminOrderStatusUpdate):
    """Update order delivery/processing status."""
    res = (
        supabase.table("orders")
        .update({"status": req.status})
        .eq("id", str(order_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )
    return {
        "message": f"Estado del pedido actualizado a {req.status}",
        "order": res.data[0],
    }
