from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.config import settings
from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import AdminLoginRequest, AdminLoginResponse, AdminUserResponse
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


def _as_dict_list(raw_data: Any) -> List[Dict[str, Any]]:
    if isinstance(raw_data, list):
        return [item for item in raw_data if isinstance(item, dict)]
    if isinstance(raw_data, dict):
        return [raw_data]
    return []


@router.post(
    "/login",
    response_model=AdminLoginResponse,
    summary="Iniciar sesión como administrador",
    description="Autentica las credenciales de administrador y emite un JWT firmado para acceder al panel.",
)
async def admin_login(
    payload: AdminLoginRequest,
    db: Client = Depends(get_supabase_client),
) -> AdminLoginResponse:
    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, email, password_hash, name, created_at")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando base de datos: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas: correo electrónico o contraseña incorrectos",
        )

    admin_row = rows[0]
    stored_hash = str(admin_row.get("password_hash", ""))

    if not verify_password(payload.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas: correo electrónico o contraseña incorrectos",
        )

    admin_id_str = str(admin_row["id"])
    access_token = create_access_token(
        subject=admin_id_str,
        claims={"email": str(admin_row["email"]), "name": str(admin_row["name"])},
    )

    user_info = AdminUserResponse(
        id=UUID(admin_id_str),
        email=str(admin_row["email"]),
        name=str(admin_row["name"]),
        created_at=admin_row.get("created_at"),
    )

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.jwt_expire_minutes * 60,
        user=user_info,
    )


@router.get(
    "/me",
    response_model=AdminUserResponse,
    summary="Obtener datos del administrador actual",
    description="Retorna el perfil del administrador autenticado a partir de su Bearer token.",
)
async def get_admin_profile(
    current_admin: AdminUserResponse = Depends(get_current_admin),
) -> AdminUserResponse:
    return current_admin
