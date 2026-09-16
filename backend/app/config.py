from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    app_name: str = "Natbell API"
    phase: int = 6
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

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

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
