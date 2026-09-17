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
    is_verified: bool = True
    created_at: Optional[datetime] = None


class AdminLoginResponse(BaseModel):
    """Respuesta exitosa de inicio de sesión de administrador."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    user: AdminUserResponse


class AdminRegisterRequest(BaseModel):
    """Payload para registro de un nuevo administrador con clave de empresa."""
    name: str = Field(..., min_length=2, max_length=100, description="Nombre completo del administrador")
    email: EmailStr = Field(..., description="Correo electrónico válido")
    password: str = Field(..., min_length=8, description="Contraseña deseada (mínimo 8 caracteres)")
    invite_code: str = Field(..., description="Clave maestra de la empresa para habilitar el registro")


class AdminVerifyEmailRequest(BaseModel):
    """Payload para verificación de correo mediante código OTP."""
    email: EmailStr = Field(..., description="Correo del administrador a verificar")
    code: str = Field(..., min_length=6, max_length=6, description="Código de 6 dígitos numéricos")


class AdminResendCodeRequest(BaseModel):
    """Solicitud de reenvío de código de verificación."""
    email: EmailStr


class AdminForgotPasswordRequest(BaseModel):
    """Solicitud de recuperación de contraseña."""
    email: EmailStr


class AdminResetPasswordRequest(BaseModel):
    """Payload para restablecer la contraseña mediante código OTP."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="Código de verificación recibido")
    new_password: str = Field(..., min_length=8, description="Nueva contraseña deseada")

