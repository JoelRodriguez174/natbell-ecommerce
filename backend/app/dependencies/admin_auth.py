from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.database import get_supabase_client
from app.models.admin import AdminUserResponse
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.security import decode_access_token

security_scheme = HTTPBearer(
    auto_error=False,
    description="Ingrese el token JWT de administrador (formato: Bearer <token>)",
)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Client = Depends(get_supabase_client),
) -> AdminUserResponse:
    """Valida el token Bearer JWT y recupera los datos del administrador autenticado.

    Arroja HTTPException(401) ante tokens ausentes, expirados, firmas inválidas o usuarios inexistentes.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere cabecera de autorización Bearer",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id_str = payload.get("sub")
    if not admin_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta identificador de usuario",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        admin_uuid = UUID(admin_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: identificador no es un UUID válido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Consulta en base de datos Supabase
    try:
        res = (
            db.table("admin_users")
            .select("id, email, name, created_at")
            .eq("id", str(admin_uuid))
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando usuario administrador: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario administrador no encontrado o revocado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = rows[0]
    return AdminUserResponse(
        id=UUID(str(user_data["id"])),
        email=str(user_data["email"]),
        name=str(user_data["name"]),
        created_at=user_data.get("created_at"),
    )
