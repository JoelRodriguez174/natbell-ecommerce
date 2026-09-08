from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends
from app.middleware.admin_auth import get_current_admin
from app.models.admin import DashboardStatsResponse
from app.database import supabase

router = APIRouter(
    prefix="/api/admin/dashboard",
    tags=["Admin Dashboard"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats():
    """Aggregate core e-commerce business KPIs: sales, pending shipments, and low inventory."""
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day).isoformat()
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0).isoformat()
    start_of_month = datetime(now.year, now.month, 1).isoformat()

    sales_today = Decimal("0.00")
    sales_week = Decimal("0.00")
    sales_month = Decimal("0.00")
    pending_count = 0
    low_stock_count = 0
    recent_orders = []

    try:
        # Fetch paid orders for sales calculation
        paid_res = (
            supabase.table("orders")
            .select("total, created_at")
            .eq("status", "paid")
            .gte("created_at", start_of_month)
            .execute()
        )
        for ord in paid_res.data or []:
            tot = Decimal(str(ord.get("total", 0)))
            created_at = ord.get("created_at", "")
            if created_at >= start_of_month:
                sales_month += tot
            if created_at >= start_of_week:
                sales_week += tot
            if created_at >= start_of_today:
                sales_today += tot

        # Pending orders count
        pending_res = (
            supabase.table("orders")
            .select("id", count="exact")
            .in_("status", ["pending", "payment_pending"])
            .execute()
        )
        pending_count = pending_res.count or 0

        # Low stock count (stock <= 5)
        low_res = (
            supabase.table("product_variants")
            .select("id", count="exact")
            .eq("is_active", True)
            .lte("stock", 5)
            .execute()
        )
        low_stock_count = low_res.count or 0

        # Recent 5 orders
        rec_res = (
            supabase.table("orders")
            .select("id, order_number, customer_name, total, status, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        recent_orders = rec_res.data or []

    except Exception:
        pass

    return DashboardStatsResponse(
        sales_today=sales_today,
        sales_this_week=sales_week,
        sales_this_month=sales_month,
        pending_orders_count=pending_count,
        low_stock_variants_count=low_stock_count,
        recent_orders=recent_orders,
    )
