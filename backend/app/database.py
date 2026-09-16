from typing import Optional

from supabase import Client, create_client

from app.config import settings

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Retorna una instancia singleton del cliente de Supabase.

    Si no se configuraron las credenciales requeridas, arroja un RuntimeError
    descriptivo para evitar operaciones silenciosas no autorizadas.
    """
    global _client
    if _client is not None:
        return _client

    url = settings.supabase_url.rstrip("/")
    key = settings.supabase_service_key or settings.supabase_anon_key

    if not url or not key:
        raise RuntimeError(
            "Credenciales de Supabase no configuradas. Por favor define SUPABASE_URL "
            "y SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY) en tu archivo .env."
        )

    _client = create_client(url, key)
    return _client


def reset_supabase_client() -> None:
    """Restablece el singleton del cliente (utilizado principalmente en tests)."""
    global _client
    _client = None
