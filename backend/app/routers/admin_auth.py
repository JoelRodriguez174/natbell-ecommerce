import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.config import settings
from app.database import get_supabase_client
from app.dependencies.admin_auth import get_current_admin
from app.models.admin import (
    AdminForgotPasswordRequest,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminRegisterRequest,
    AdminResendCodeRequest,
    AdminResetPasswordRequest,
    AdminUserResponse,
    AdminVerifyEmailRequest,
)
from app.services.email_service import EmailService, get_email_service
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


def _generate_otp_code() -> str:
    """Generates a secure 6-digit numeric OTP code."""
    return f"{secrets.randbelow(1_000_000):06d}"


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo administrador con clave de empresa",
    description="Permite a un administrador crear su cuenta utilizando la clave de seguridad de la empresa y envía un OTP de verificación por correo.",
)
async def admin_register(
    payload: AdminRegisterRequest,
    db: Client = Depends(get_supabase_client),
    email_service: EmailService = Depends(get_email_service),
) -> Dict[str, str]:
    if payload.invite_code.strip() != settings.admin_invite_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clave de empresa inválida o no autorizada",
        )

    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, email, is_verified")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar correo existente: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    otp = _generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    pw_hash = hash_password(payload.password)

    if rows:
        existing = rows[0]
        if existing.get("is_verified") is not False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya se encuentra registrado",
            )
        # Cuenta pendiente de verificación previa: actualizamos credenciales y emitimos nuevo OTP
        try:
            db.table("admin_users").update({
                "name": payload.name.strip(),
                "password_hash": pw_hash,
                "verification_code": otp,
                "verification_code_expires_at": expires_at.isoformat(),
            }).eq("id", existing["id"]).execute()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error actualizando registro pendiente: {exc}",
            )
    else:
        # Nuevo registro
        try:
            db.table("admin_users").insert({
                "email": email_clean,
                "name": payload.name.strip(),
                "password_hash": pw_hash,
                "is_verified": False,
                "verification_code": otp,
                "verification_code_expires_at": expires_at.isoformat(),
            }).execute()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error registrando nuevo administrador: {exc}",
            )

    await email_service.send_verification_email(
        to_email=email_clean,
        name=payload.name.strip(),
        code=otp,
    )

    return {
        "message": "Código de verificación enviado exitosamente a tu correo electrónico",
        "email": email_clean,
    }


@router.post(
    "/verify-email",
    response_model=AdminLoginResponse,
    summary="Verificar correo mediante código OTP",
    description="Valida el código de 6 dígitos enviado por email y activa la cuenta del administrador, retornando un JWT.",
)
async def admin_verify_email(
    payload: AdminVerifyEmailRequest,
    db: Client = Depends(get_supabase_client),
) -> AdminLoginResponse:
    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, email, name, is_verified, verification_code, verification_code_expires_at, created_at")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando usuario: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    admin_row = rows[0]
    if admin_row.get("is_verified") is True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya se encuentra verificada. Podés iniciar sesión directamente.",
        )

    stored_code = admin_row.get("verification_code")
    if not stored_code or stored_code.strip() != payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación incorrecto",
        )

    expires_at_str = admin_row.get("verification_code_expires_at")
    if expires_at_str:
        exp = datetime.fromisoformat(expires_at_str)
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ha expirado. Solicitá uno nuevo.",
            )

    admin_id_str = str(admin_row["id"])

    try:
        db.table("admin_users").update({
            "is_verified": True,
            "verification_code": None,
            "verification_code_expires_at": None,
        }).eq("id", admin_id_str).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando estado de verificación: {exc}",
        )

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


@router.post(
    "/resend-code",
    summary="Reenviar código de verificación de correo",
)
async def admin_resend_code(
    payload: AdminResendCodeRequest,
    db: Client = Depends(get_supabase_client),
    email_service: EmailService = Depends(get_email_service),
) -> Dict[str, str]:
    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, email, name, is_verified")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando usuario: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if rows:
        admin_row = rows[0]
        if admin_row.get("is_verified") is False:
            otp = _generate_otp_code()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.table("admin_users").update({
                "verification_code": otp,
                "verification_code_expires_at": expires_at.isoformat(),
            }).eq("id", admin_row["id"]).execute()

            await email_service.send_verification_email(
                to_email=email_clean,
                name=str(admin_row.get("name", "Administrador")),
                code=otp,
            )

    return {"message": "Si la cuenta existe y está pendiente de verificación, se reenvió el código"}


@router.post(
    "/forgot-password",
    summary="Solicitar código para recuperar contraseña",
)
async def admin_forgot_password(
    payload: AdminForgotPasswordRequest,
    db: Client = Depends(get_supabase_client),
    email_service: EmailService = Depends(get_email_service),
) -> Dict[str, str]:
    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, email, name")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando usuario: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if rows:
        admin_row = rows[0]
        otp = _generate_otp_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        db.table("admin_users").update({
            "reset_password_code": otp,
            "reset_password_expires_at": expires_at.isoformat(),
        }).eq("id", admin_row["id"]).execute()

        await email_service.send_password_reset_email(
            to_email=email_clean,
            name=str(admin_row.get("name", "Administrador")),
            code=otp,
        )

    return {
        "message": "Si la dirección de correo corresponde a una cuenta registrada, recibirás un código de recuperación."
    }


@router.post(
    "/reset-password",
    summary="Restablecer contraseña mediante código OTP",
)
async def admin_reset_password(
    payload: AdminResetPasswordRequest,
    db: Client = Depends(get_supabase_client),
) -> Dict[str, str]:
    email_clean = payload.email.strip().lower()

    try:
        res = (
            db.table("admin_users")
            .select("id, reset_password_code, reset_password_expires_at")
            .eq("email", email_clean)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando usuario: {exc}",
        )

    rows = _as_dict_list(res.data) if res else []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solicitud inválida o código expirado",
        )

    admin_row = rows[0]
    stored_code = admin_row.get("reset_password_code")
    if not stored_code or stored_code.strip() != payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de recuperación inválido o incorrecto",
        )

    expires_at_str = admin_row.get("reset_password_expires_at")
    if expires_at_str:
        exp = datetime.fromisoformat(expires_at_str)
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de recuperación ha expirado. Solicitá uno nuevo.",
            )

    new_hash = hash_password(payload.new_password)
    try:
        db.table("admin_users").update({
            "password_hash": new_hash,
            "reset_password_code": None,
            "reset_password_expires_at": None,
        }).eq("id", admin_row["id"]).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando contraseña: {exc}",
        )

    return {
        "message": "Contraseña actualizada exitosamente. Ya podés iniciar sesión con tu nueva contraseña."
    }


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

    # Verificar si la cuenta ha completado la verificación por email (default True para cuentas semilla)
    if admin_row.get("is_verified") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta aún no ha sido verificada. Revisá tu correo electrónico o ingresá tu código de verificación.",
        )

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
