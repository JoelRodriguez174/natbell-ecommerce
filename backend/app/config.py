from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    app_name: str = "Natbell API"
    phase: int = 8
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins

    # Supabase Configuration
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""

    # MercadoPago Configuration
    mercadopago_access_token: str = ""
    mercadopago_public_key: str = ""
    mercadopago_webhook_secret: str = ""
    mercadopago_mode: str = "auto"  # "auto", "mock", or "real"
    mercadopago_sandbox: bool = True

    # JWT & Admin Security Configuration
    jwt_secret_key: str = "natbell-ecommerce-secret-key-2026-production-min-32-chars-long"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 horas de sesión admin
    admin_invite_code: str = "NatbellAdmin2026!"

    # Email Service Configuration (Resend)
    resend_api_key: str = ""
    email_from: str = "Natbell <onboarding@resend.dev>"

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
