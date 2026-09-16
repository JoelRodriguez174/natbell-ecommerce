from fastapi import APIRouter, Depends
from supabase import Client

from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminUserResponse
from app.models.admin_dashboard import AdminDashboardMetricsResponse
from app.services.admin_dashboard_service import AdminDashboardService

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])


@router.get(
    "/metrics",
    response_model=AdminDashboardMetricsResponse,
    summary="Obtener métricas y KPIs del panel de administración",
    description="Calcula facturación acumulada, órdenes por estado y alertas de inventario crítico.",
)
async def get_dashboard_metrics(
    _current_admin: AdminUserResponse = Depends(get_current_admin),
    db: Client = Depends(get_supabase_client),
) -> AdminDashboardMetricsResponse:
    service = AdminDashboardService(db)
    return await service.get_metrics()
