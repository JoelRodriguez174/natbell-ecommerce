import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_categories_tree():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            first = data[0]
            assert "name" in first
            assert "slug" in first
            assert "subcategories" in first
            assert isinstance(first["subcategories"], list)


@pytest.mark.asyncio
async def test_get_brands_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/brands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            first = data[0]
            assert "name" in first
            assert "slug" in first
            assert "is_active" in first
            assert first["is_active"] is True


@pytest.mark.asyncio
async def test_get_categories_filtered_by_brand():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Wahl solo tiene productos en Máquinas y Herramientas Eléctricas
        response = await client.get("/api/categories?brand=wahl")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Si la marca existe, sus categorías deben estar relacionadas
        for cat in data:
            assert "name" in cat
            assert "slug" in cat


@pytest.mark.asyncio
async def test_get_brands_filtered_by_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Coloración solo tiene marcas que vendan coloración (ej. Nov, Plasma)
        response = await client.get("/api/brands?category=coloracion")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Todas las marcas retornadas deben ser válidas
        for b in data:
            assert "name" in b
            assert "slug" in b
            assert b["is_active"] is True
