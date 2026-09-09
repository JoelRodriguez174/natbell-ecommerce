from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Los Arrayanes API"
    phase: int = 2
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Supabase Configuration
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
