def test_mercadopago_settings_loaded():
    from app.config import settings
    assert hasattr(settings, "mercadopago_access_token")
    assert hasattr(settings, "mercadopago_public_key")
    assert hasattr(settings, "mercadopago_webhook_secret")
    assert settings.phase >= 6
