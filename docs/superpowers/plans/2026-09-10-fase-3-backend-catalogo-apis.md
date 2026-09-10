# Fase 3: Backend — Catálogo y APIs Públicas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar los endpoints REST públicos y la capa de servicios desacoplada para consultar el catálogo de productos (filtros, ordenamiento, paginación defensiva, búsqueda, destacados, ofertas y detalle con variantes) y las taxonomías (árbol de categorías y listado de marcas), respaldado por una suite exhaustiva de tests unitarios y pentests de seguridad de APIs.

**Architecture:** Arquitectura limpia en capas desacopladas:
- **Models/Schemas (`backend/app/models/`):** Contratos Pydantic v2 para parámetros de filtrado (`ProductFilters`), metadatos de paginación (`PaginationMetadata`), items de catálogo (`ProductListItem`), detalle con variantes (`ProductDetailResponse`) y árboles taxonómicos.
- **Services (`backend/app/services/`):** Funciones de lógica de negocio puras y consultas optimizadas a PostgREST (`catalog_service.py`, `taxonomy_service.py`), desacopladas de FastAPI y fácilmente testeables con clientes mock.
- **Routers (`backend/app/routers/`):** Controladores HTTP atómicos con inyección de dependencias (`products.py`, `taxonomies.py`) montados en `main.py`.
- **Tests & Pentesting (`backend/tests/`):** Tests con `pytest`, `pytest-asyncio` y `httpx.AsyncClient`, incluyendo suite defensiva contra inyecciones, fuzzing y abusos de paginación.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, `supabase-py` (PostgREST HTTPS), `httpx`, `pytest`, `pytest-asyncio`.

**Spec:** [`docs/specs/2026-09-08-ecommerce-belleza-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/specs/2026-09-08-ecommerce-belleza-design.md), [`docs/FASES_PROYECTO.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/FASES_PROYECTO.md) y [`docs/superpowers/specs/2026-09-10-estrategia-testing-y-pentesting-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/superpowers/specs/2026-09-10-estrategia-testing-y-pentesting-design.md).

## Global Constraints
- Estricta separación en capas: Routers ➔ Services ➔ Models/Schemas ➔ Database.
- Paginación defensiva obligatoria: límite predeterminado 20, límite máximo absoluto 50 para evitar denegación de servicio por memoria.
- Orden de rutas estricto: `/featured`, `/on-sale`, `/search` deben registrarse antes de `/{slug}` para evitar colisiones de rutas dinámicas.
- Manejo seguro de errores 404 ante slugs inexistentes sin fugar trazas de error (stack traces) ni detalles internos de la base de datos.
- No se incorporan nuevas dependencias sin consulta previa (se utilizan las existentes en `requirements.txt`).

---

### Task 1: Schemas de Catálogo, Paginación y Filtros (Pydantic v2)

**Files:**
- Create: `backend/app/models/catalog.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_catalog_schemas.py`

**Interfaces:**
- Produces:
  - `PaginationMetadata`: `page: int`, `per_page: int`, `total_items: int`, `total_pages: int`, `has_next: bool`, `has_prev: bool`
  - `ProductListItem`: Representación optimizada de producto en grilla/card con marca, categoría, rango de precios (`min_price`, `max_price`), disponibilidad de stock (`in_stock`) y badges.
  - `ProductDetailResponse`: Producto completo con información enriquecida de marca, categoría, subcategoría y lista de variantes activas.
  - `ProductFilters`: Validación de query params (`page`, `per_page`, `category`, `subcategory`, `brand`, `min_price`, `max_price`, `sort`).
  - `PaginatedProductsResponse`: `items: list[ProductListItem]`, `pagination: PaginationMetadata`.

- [x] **Step 1: Escribir test de validación para schemas de catálogo y paginación**

```python
# backend/tests/test_catalog_schemas.py
from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.models.catalog import (
    PaginationMetadata,
    ProductFilters,
    ProductListItem,
    PaginatedProductsResponse,
)


def test_pagination_metadata_calculation():
    meta = PaginationMetadata(
        page=2,
        per_page=20,
        total_items=45,
        total_pages=3,
        has_next=True,
        has_prev=True,
    )
    assert meta.total_pages == 3
    assert meta.has_next is True


def test_product_filters_validation():
    # Filtros válidos por defecto
    filters = ProductFilters()
    assert filters.page == 1
    assert filters.per_page == 20

    # Límite superior defensivo (max 50)
    filters_custom = ProductFilters(page=2, per_page=50, sort="price_asc")
    assert filters_custom.per_page == 50

    # Rechazo si per_page excede el máximo permitido
    with pytest.raises(ValidationError):
        ProductFilters(per_page=100)

    # Rechazo si precios son negativos
    with pytest.raises(ValidationError):
        ProductFilters(min_price=Decimal("-10.00"))
```

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_catalog_schemas.py -v`
Expected: FAIL con "cannot import name 'PaginationMetadata'"

- [x] **Step 3: Implementar `backend/app/models/catalog.py`**
Definir contratos de datos con validaciones estrictas y tipado Pydantic v2.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_catalog_schemas.py -v`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add backend/app/models/catalog.py backend/app/models/__init__.py backend/tests/test_catalog_schemas.py
git commit -m "feat(phase-3): add catalog response schemas and filter models with strict validation"
```

---

### Task 2: Servicio y Router de Taxonomías (`/api/categories`, `/api/brands`)

**Files:**
- Create: `backend/app/services/taxonomy_service.py`
- Create: `backend/app/routers/taxonomies.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_taxonomy_endpoints.py`

**Interfaces:**
- Produces:
  - `TaxonomyService.get_categories_tree(client)` -> `list[Category]`
  - `TaxonomyService.get_brands(client)` -> `list[Brand]`
  - Endpoints: `GET /api/categories`, `GET /api/brands`

- [x] **Step 1: Escribir test para endpoints de categorías y marcas con `httpx.AsyncClient`**

```python
# backend/tests/test_taxonomy_endpoints.py
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
            assert "name" in data[0]
            assert "slug" in data[0]
            assert "subcategories" in data[0]


@pytest.mark.asyncio
async def test_get_brands_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/brands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "name" in data[0]
            assert "slug" in data[0]
            assert "is_active" in data[0]
```

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_taxonomy_endpoints.py -v`
Expected: FAIL con 404 Not Found

- [x] **Step 3: Implementar `taxonomy_service.py` y `routers/taxonomies.py`**
Crear servicio con consultas ordenadas a `categories`, `subcategories` y `brands`, y montar router en `backend/app/main.py`.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_taxonomy_endpoints.py -v`
Expected: PASS (2/2)

- [x] **Step 5: Commit**
```bash
git add backend/app/services/taxonomy_service.py backend/app/routers/taxonomies.py backend/app/main.py backend/tests/test_taxonomy_endpoints.py
git commit -m "feat(phase-3): implement categories tree and brands public endpoints"
```

---

### Task 3: Capa de Servicio del Catálogo (`catalog_service.py`)

**Files:**
- Create: `backend/app/services/catalog_service.py`
- Test: `backend/tests/test_catalog_service.py`

**Interfaces:**
- Produces:
  - `CatalogService.get_products(client, filters: ProductFilters) -> PaginatedProductsResponse`
  - `CatalogService.get_product_by_slug(client, slug: str) -> Optional[ProductDetailResponse]`
  - `CatalogService.get_featured_products(client, limit: int = 8) -> list[ProductListItem]`
  - `CatalogService.get_on_sale_products(client, limit: int = 8) -> list[ProductListItem]`
  - `CatalogService.search_products(client, query: str, limit: int = 20) -> list[ProductListItem]`

- [x] **Step 1: Escribir test unitario aislado para métodos de `CatalogService`**
Validar que `CatalogService` construye consultas correctas, transforma variantes en rangos de precios (`min_price`, `max_price`), calcula totales de stock y arma la estructura de paginación.

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_catalog_service.py -v`
Expected: FAIL ("cannot import CatalogService")

- [x] **Step 3: Implementar `backend/app/services/catalog_service.py`**
Implementar funciones de consulta sobre `products` y `product_variants` con joins en PostgREST (`select="*, brands(*), subcategories(*, categories(*)), product_variants(*)"`), filtros dinámicos (categoría, marca, rango de precios) y cálculo de paginación.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_catalog_service.py -v`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add backend/app/services/catalog_service.py backend/tests/test_catalog_service.py
git commit -m "feat(phase-3): implement core catalog business service with query transforms"
```

---

### Task 4: Router y Endpoints Públicos de Productos (`/api/products`)

**Files:**
- Create: `backend/app/routers/products.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_product_endpoints.py`

**Interfaces:**
- Produces Endpoints:
  - `GET /api/products`: listado con filtros combinables (`category`, `subcategory`, `brand`, `min_price`, `max_price`, `sort`, `page`, `per_page`).
  - `GET /api/products/featured`: productos destacados (`is_featured=true`).
  - `GET /api/products/on-sale`: productos en oferta (`is_on_sale=true`).
  - `GET /api/products/search?q=`: búsqueda de texto en títulos y descripciones.
  - `GET /api/products/{slug}`: detalle con variantes y stock. Retorna 404 si no existe.

- [x] **Step 1: Escribir tests de integración de endpoints de productos (`test_product_endpoints.py`)**
Verificar:
- Respuesta 200 y estructura paginada en `/api/products`.
- Respuesta 200 en `/api/products/featured` y `/api/products/on-sale`.
- Búsqueda en `/api/products/search?q=tintura`.
- Respuesta 404 limpia ante `GET /api/products/slug-inexistente-123`.

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_product_endpoints.py -v`
Expected: FAIL (404 en todas las rutas)

- [x] **Step 3: Implementar `backend/app/routers/products.py` y montar en `main.py`**
Registrar rutas respetando el orden estricto de precedencia: `/featured`, `/on-sale`, `/search` antes de `/{slug}`.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_product_endpoints.py -v`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add backend/app/routers/products.py backend/app/main.py backend/tests/test_product_endpoints.py
git commit -m "feat(phase-3): add REST endpoints for products, filters, search and details"
```

---

### Task 5: Pentesting Defensivo y Tests de Seguridad de APIs (`test_catalog_security.py`)

**Files:**
- Create: `backend/tests/test_catalog_security.py`

**Interfaces:**
- Produces: Suite de pruebas de penetración y abuso en catálogo conforme a la especificación de diseño de seguridad.

- [x] **Step 1: Escribir suite de pentesting defensivo para el catálogo**

```python
# backend/tests/test_catalog_security.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_sql_postgrest_injection_in_search():
    """Verifica que inyecciones SQL / PostgREST en búsqueda no causen caídas 500 ni ejecuten código."""
    attacks = [
        "tintura' OR '1'='1",
        "nov'; DROP TABLE products; --",
        "eq.1",
        "()",
        "%00",
        "<script>alert(1)</script>",
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for payload in attacks:
            response = await client.get(f"/api/products/search?q={payload}")
            # Debe responder 200 con lista vacía o resultados seguros, jamás 500
            assert response.status_code == 200
            assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_pagination_abuse_defense():
    """Verifica que límites abusivos de paginación sean rechazados con 422 o acotados."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Petición abusiva de 1 millón de registros (DoS por memoria)
        res_high = await client.get("/api/products?per_page=1000000")
        assert res_high.status_code == 422  # Validación Pydantic rechaza > 50

        # Petición con página negativa
        res_neg = await client.get("/api/products?page=-1")
        assert res_neg.status_code == 422


@pytest.mark.asyncio
async def test_slug_fuzzing_and_path_traversal_defense():
    """Verifica que caracteres anómalos o intentos de path traversal retornen 404 limpio sin leak de stack traces."""
    fuzz_slugs = [
        "../../etc/passwd",
        "..%2F..%2F",
        "null%00byte",
        "con'quote",
        "very-long-" + ("a" * 300),
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for bad_slug in fuzz_slugs:
            response = await client.get(f"/api/products/{bad_slug}")
            assert response.status_code in [404, 422]
            assert "traceback" not in response.text.lower()
            assert "exception" not in response.text.lower()
```

- [x] **Step 2: Correr suite de pentesting**
Run: `pytest backend/tests/test_catalog_security.py -v`
Expected: PASS (3/3)

- [x] **Step 3: Commit**
```bash
git add backend/tests/test_catalog_security.py
git commit -m "test(phase-3): add defensive pentesting suite for catalog endpoints"
```

---

### Task 6: Actualización de Health Check y Verificación Integral de Fase 3

**Files:**
- Modify: `backend/app/main.py`
- Test: `backend/tests/` (suite completa)

- [x] **Step 1: Actualizar mensaje de Fase 3 en `/api/health`**
Actualizar mensaje para reflejar que la Fase 3 está activa con APIs de catálogo y taxonomías públicas.

- [x] **Step 2: Ejecutar la suite completa de tests de la Fase 1, 2 y 3**
Run: `pytest backend/tests/ -v`
Expected: 100% de tests pasando (~25+ tests totales).

- [x] **Step 3: Commit**
```bash
git add backend/app/main.py
git commit -m "feat(phase-3): update health check status and complete phase 3 backend catalog"
```
