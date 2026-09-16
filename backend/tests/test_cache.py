import time
import pytest
from app.utils.cache import CacheMemory, cached


def test_cache_set_and_get():
    cache = CacheMemory()
    cache.set("test:key", {"name": "Shampoo"}, ttl_seconds=10)
    assert cache.get("test:key") == {"name": "Shampoo"}
    assert cache.get("non_existent") is None


def test_cache_ttl_expiration():
    cache = CacheMemory()
    cache.set("temp:key", "value", ttl_seconds=1)
    assert cache.get("temp:key") == "value"

    # Simular paso del tiempo manipulando monotonic o con TTL de 0s
    cache.set("expired:key", "expired", ttl_seconds=0)
    # TTL de 0 expira inmediatamente
    assert cache.get("expired:key") is None


def test_cache_invalidate_prefix():
    cache = CacheMemory()
    cache.set("cat:1", "Tinturas", ttl_seconds=60)
    cache.set("cat:2", "Cuidado", ttl_seconds=60)
    cache.set("brand:1", "Nov", ttl_seconds=60)

    removed = cache.invalidate_prefix("cat:")
    assert removed == 2
    assert cache.get("cat:1") is None
    assert cache.get("cat:2") is None
    assert cache.get("brand:1") == "Nov"


def test_cache_clear():
    cache = CacheMemory()
    cache.set("a", 1, ttl_seconds=60)
    cache.set("b", 2, ttl_seconds=60)
    cache.clear()
    assert cache.get("a") is None
    assert cache.get("b") is None


@pytest.mark.asyncio
async def test_cached_decorator_async():
    cache = CacheMemory()
    call_count = 0

    @cached(ttl_seconds=10, prefix="test_async", cache_instance=cache)
    async def fetch_data(x: int, client=None):
        nonlocal call_count
        call_count += 1
        return {"result": x * 2}

    # Primera llamada: ejecuta la función
    res1 = await fetch_data(5, client="fake_supabase_client_1")
    assert res1 == {"result": 10}
    assert call_count == 1

    # Segunda llamada con mismo argumento x y diferente client: DEBE venir de caché (call_count sigue en 1)
    res2 = await fetch_data(5, client="fake_supabase_client_2")
    assert res2 == {"result": 10}
    assert call_count == 1

    # Llamada con diferente x: ejecuta la función
    res3 = await fetch_data(10)
    assert res3 == {"result": 20}
    assert call_count == 2


def test_cached_decorator_classmethod():
    cache = CacheMemory()
    calls = 0

    class DummyService:
        @classmethod
        @cached(ttl_seconds=60, prefix="dummy_svc", cache_instance=cache)
        def compute(cls, client, val: str):
            nonlocal calls
            calls += 1
            return f"computed:{val}"

    r1 = DummyService.compute("client_obj_1", val="shampoo")
    assert r1 == "computed:shampoo"
    assert calls == 1

    # Segunda llamada con distinto client debe dar cache hit
    r2 = DummyService.compute("client_obj_2", val="shampoo")
    assert r2 == "computed:shampoo"
    assert calls == 1

    # Diferente val ejecuta
    r3 = DummyService.compute("client_obj_1", val="acondicionador")
    assert r3 == "computed:acondicionador"
    assert calls == 2


@pytest.mark.asyncio
async def test_endpoint_cache_control_headers():
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Categorías deben tener max-age=300 (5 minutos)
        cat_res = await client.get("/api/categories")
        assert cat_res.status_code == 200
        assert "cache-control" in cat_res.headers
        assert "max-age=300" in cat_res.headers["cache-control"]

        # Featured products deben tener max-age=60 (1 minuto)
        feat_res = await client.get("/api/products/featured")
        assert feat_res.status_code == 200
        assert "cache-control" in feat_res.headers
        assert "max-age=60" in feat_res.headers["cache-control"]
