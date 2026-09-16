from unittest.mock import MagicMock, patch

import pytest

from app.database import get_supabase_client, reset_supabase_client


def test_get_supabase_client_missing_credentials():
    """Verifica que si no hay credenciales configuradas, arroje un error descriptivo."""
    reset_supabase_client()
    with patch("app.database.settings.supabase_url", ""), patch(
        "app.database.settings.supabase_service_key", ""
    ):
        with pytest.raises(RuntimeError) as exc_info:
            get_supabase_client()
        assert "Credenciales de Supabase no configuradas" in str(exc_info.value)


def test_get_supabase_client_singleton():
    """Verifica que el cliente use el patrón Singleton y reutilice la misma instancia."""
    reset_supabase_client()
    mock_client = MagicMock()
    with patch("app.database.settings.supabase_url", "https://mock.supabase.co"), patch(
        "app.database.settings.supabase_service_key", "mock-service-key"
    ), patch("app.database.create_client", return_value=mock_client) as mock_create:
        client1 = get_supabase_client()
        client2 = get_supabase_client()

        # Debe llamarse una sola vez a create_client gracias al singleton
        mock_create.assert_called_once_with(
            "https://mock.supabase.co", "mock-service-key"
        )
        assert client1 is mock_client
        assert client2 is client1
    reset_supabase_client()
