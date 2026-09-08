from fastapi import APIRouter, HTTPException, Depends, status
from app.models.admin import AdminLoginRequest, AdminLoginResponse, AdminUserResponse
from app.middleware.admin_auth import (
    verify_password,
    create_access_token,
    get_current_admin,
)
from app.database import supabase

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(req: AdminLoginRequest):
    """Authenticate administrator with email and password, returning a JWT token."""
    email = req.email.lower().strip()

    admin = None
    try:
        res = (
            supabase.table("admin_users")
            .select("id, email, password_hash, name, created_at")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if res.data:
            admin = res.data[0]
    except Exception:
        admin = None

    # Development fallback if DB is not populated yet
    if not admin and email == "admin@losarrayanes.com" and req.password == "admin123!":
        admin = {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "admin@losarrayanes.com",
            "password_hash": "",
            "name": "Admin Los Arrayanes",
        }
    elif not admin or not verify_password(req.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
        )

    # Generate JWT
    token_payload = {
        "sub": str(admin["id"]),
        "email": admin["email"],
        "name": admin["name"],
    }
    access_token = create_access_token(token_payload)

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=AdminUserResponse(
            id=admin["id"],
            email=admin["email"],
            name=admin["name"],
            created_at=admin.get("created_at"),
        ),
    )


@router.get("/me", response_model=AdminUserResponse)
async def get_admin_profile(current_admin: dict = Depends(get_current_admin)):
    """Retrieve profile of authenticated administrator."""
    return AdminUserResponse(
        id=current_admin["id"],
        email=current_admin["email"],
        name=current_admin["name"],
        created_at=current_admin.get("created_at"),
    )
