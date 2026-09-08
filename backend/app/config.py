from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  app_name: str = "Los Arrayanes API"
  phase: int = 1
  frontend_url: str = "http://localhost:3000"
  backend_url: str = "http://localhost:8000"

  class Config:
    env_file = ".env"
    extra = "ignore"


settings = Settings()
