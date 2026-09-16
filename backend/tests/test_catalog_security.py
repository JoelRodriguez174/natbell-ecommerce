import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_sql_postgrest_injection_in_search():
    """
    Verifica que payloads maliciosos de inyección SQL / PostgREST en búsqueda
    no causen caídas 500, no fuguen datos ni ejecuten comandos.
    """
    attacks = [
        "tintura' OR '1'='1",
        "nov'; DROP TABLE products; --",
        "eq.1",
        "()",
        "%00",
        "<script>alert(1)</script>",
        "../../etc/passwd",
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for payload in attacks:
            response = await client.get(f"/api/products/search?q={payload}")
            # Debe responder 200 con lista sanitizada (vacía o sin crash), jamás 500
            assert response.status_code == 200
            assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_pagination_abuse_defense():
    """
    Verifica que límites abusivos de paginación sean rechazados defensivamente
    con 422 Unprocessable Entity (defensa contra DoS por memoria).
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Petición abusiva de 1 millón de registros por página
        res_high = await client.get("/api/products?per_page=1000000")
        assert res_high.status_code == 422

        # Petición con página negativa
        res_neg = await client.get("/api/products?page=-1")
        assert res_neg.status_code == 422

        # Petición con per_page negativo o cero
        res_zero = await client.get("/api/products?per_page=0")
        assert res_zero.status_code == 422


@pytest.mark.asyncio
async def test_slug_fuzzing_and_path_traversal_defense():
    """
    Verifica que caracteres anómalos o intentos de path traversal retornen
    404 o 422 limpio sin fugar trazas de error (tracebacks) ni detalles internos.
    """
    fuzz_slugs = [
        "../../etc/passwd",
        "..%2F..%2F",
        "null%00byte",
        "con'quote",
        "very-long-slug-" + ("a" * 300),
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for bad_slug in fuzz_slugs:
            response = await client.get(f"/api/products/{bad_slug}")
            assert response.status_code in [404, 422]
            text = response.text.lower()
            assert "traceback" not in text
            assert "psycopg2" not in text
            assert "postgrest" not in text


@pytest.mark.asyncio
async def test_negative_price_filter_defense():
    """
    Verifica que precios negativos en filtros de catálogo sean rechazados por Pydantic.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/products?min_price=-50.00")
        assert response.status_code == 422
