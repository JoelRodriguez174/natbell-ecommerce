import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_get_products_paginated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "pagination" in data
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 10
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_get_products_filtered_by_on_sale():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products?on_sale=true")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0
        # Absolutamente todos los productos devueltos deben estar marcados en oferta
        for item in data["items"]:
            assert item["is_on_sale"] is True


@pytest.mark.asyncio
async def test_get_featured_products():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_on_sale_products():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products/on-sale")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_search_products():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products/search?q=tintura")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_product_detail_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products/slug-totalmente-inexistente-xyz")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "no encontrado" in data["detail"].lower()
