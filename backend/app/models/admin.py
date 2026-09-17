from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    """Payload para autenticación de administrador."""
    email: EmailStr = Field(..., description="Correo electrónico del administrador")
    password: str = Field(..., min_length=6, description="Contraseña en texto plano")


class AdminUserResponse(BaseModel):
    """Información pública y segura del administrador autenticado."""
    id: UUID
    email: EmailStr
    name: str
    created_at: Optional[datetime] = None


class AdminLoginResponse(BaseModel):
    """Respuesta exitosa de inicio de sesión de administrador."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    user: AdminUserResponse
