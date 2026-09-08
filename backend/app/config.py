from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_key: str = "placeholder_key"
    mercadopago_access_token: str = "TEST-placeholder-token"
    qstash_token: str = "placeholder_token"
    qstash_current_signing_key: str = ""
    qstash_next_signing_key: str = ""
    jwt_secret_key: str = "dev-secret-key-change-in-production-123456789"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
