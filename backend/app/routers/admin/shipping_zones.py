from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.admin_auth import get_current_admin
from app.models.shipping import ShippingZoneCreate, ShippingZoneUpdate
from app.database import supabase

router = APIRouter(
    prefix="/api/admin/shipping-zones",
    tags=["Admin Shipping Zones"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("")
async def list_shipping_zones():
    """List all configured shipping zones."""
    res = supabase.table("shipping_zones").select("*").order("created_at").execute()
    return res.data or []


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_shipping_zone(req: ShippingZoneCreate):
    """Create a new shipping zone."""
    insert_data = {
        "zone_name": req.zone_name,
        "postal_code_ranges": req.postal_code_ranges,
        "cost": float(req.cost),
        "estimated_days": req.estimated_days,
        "is_active": req.is_active,
    }
    res = supabase.table("shipping_zones").insert(insert_data).execute()
    return res.data[0] if res.data else insert_data


@router.put("/{zone_id}")
async def update_shipping_zone(zone_id: UUID, req: ShippingZoneUpdate):
    """Update an existing shipping zone."""
    update_data = {}
    if req.zone_name is not None:
        update_data["zone_name"] = req.zone_name
    if req.postal_code_ranges is not None:
        update_data["postal_code_ranges"] = req.postal_code_ranges
    if req.cost is not None:
        update_data["cost"] = float(req.cost)
    if req.estimated_days is not None:
        update_data["estimated_days"] = req.estimated_days
    if req.is_active is not None:
        update_data["is_active"] = req.is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar")

    res = (
        supabase.table("shipping_zones")
        .update(update_data)
        .eq("id", str(zone_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Zona de envío no encontrada")
    return res.data[0]


@router.delete("/{zone_id}")
async def delete_shipping_zone(zone_id: UUID):
    """Soft delete shipping zone."""
    res = (
        supabase.table("shipping_zones")
        .update({"is_active": False})
        .eq("id", str(zone_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Zona de envío no encontrada")
    return {"message": "Zona de envío desactivada", "id": str(zone_id)}
