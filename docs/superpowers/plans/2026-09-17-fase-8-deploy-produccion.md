# Fase 8: Deploy y Puesta en Producción Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el paquete de infraestructura, endurecimiento de seguridad, configuración de despliegue en Render y Vercel, smoke tests automatizados y guía de puesta en producción para Natbell E-commerce.

**Architecture:** Backend FastAPI containerizado y reforzado con middleware de cabeceras de seguridad (HSTS, CSP, X-Frame-Options) y CORS estricto configurable; frontend Next.js 14 optimizado para Vercel Edge; smoke test script E2E para verificación automática pre/post-deploy; documentación integral de variables y pasarela productiva.

**Tech Stack:** FastAPI, Python 3.13, Docker, Next.js 14, Vercel, Render, Supabase Cloud, MercadoPago SDK, Pytest, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-17-fase-8-deploy-produccion-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/superpowers/specs/2026-09-17-fase-8-deploy-produccion-design.md)

## Global Constraints
- Cumplimiento total de calidad: 0 errores en `ruff check app tests` y `npm run lint`.
- 100% de tests unitarios y de integración pasando en backend y frontend.
- Cero claves o secretos reales en repositorios o archivos versionados.
- Preservar compatibilidad total con desarrollo local sin romper el flujo actual.

---

### Task 1: Hardening de Seguridad, Cabeceras HTTP y CORS Dinámico en Backend

**Files:**
- Create: `backend/tests/test_security_headers.py`
- Modify: `backend/app/config.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: FastAPI middleware stack y Pydantic Settings.
- Produces: Cabeceras defensivas (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`) en todas las respuestas HTTP; CORS parametrizado vía `ALLOWED_ORIGINS`; actualización de `phase: int = 8` en config.

- [ ] **Step 1: Escribir el test fallido para cabeceras de seguridad y CORS**

```python
# backend/tests/test_security_headers.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_security_headers_present():
    response = client.get("/api/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-content-type-options") == "nosniff"
    assert "strict-transport-security" in headers
    assert "referrer-policy" in headers
    assert "content-security-policy" in headers

def test_cors_headers_with_origin():
    response = client.options(
        "/api/products",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `pytest backend/tests/test_security_headers.py -v`  
Expected: FAIL porque las cabeceras defensivas personalizadas aún no están añadidas.

- [ ] **Step 3: Implementar cabeceras defensivas y CORS configurable en `app/config.py` y `app/main.py`**

Actualizar `backend/app/config.py`:
- Añadir campo `phase: int = 8`.
- Añadir campo `allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]`.

Actualizar `backend/app/main.py`:
- Middleware HTTP que inyecte cabeceras de seguridad a cada respuesta.
- CORSMiddleware configurado con `settings.allowed_origins`.

- [ ] **Step 4: Ejecutar los tests para verificar que pasen**

Run: `pytest backend/tests/test_security_headers.py -v`  
Expected: PASS

- [ ] **Step 5: Ejecutar suite completa y linter**

Run: `pytest backend/tests/ -q` y `ruff check backend/app backend/tests`  
Expected: 99+ tests pasando, 0 errores.

---

### Task 2: Infraestructura como Código y Despliegue Backend (Render)

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `render.yaml`
- Create: `backend/.env.production.example`

**Interfaces:**
- Consumes: `backend/pyproject.toml` y aplicación FastAPI en `app/main.py`.
- Produces: Contenedor Docker listo para producción, archivo IaC `render.yaml` y plantilla de variables de entorno productivas.

- [ ] **Step 1: Crear `backend/Dockerfile` multi-stage y optimizado**

Configurar multi-etapa con base `python:3.13-slim`, usuario no privilegiado (`appuser`), caching de capas de dependencias, y comando de ejecución con soporte para `$PORT`.

- [ ] **Step 2: Crear `backend/.dockerignore`**

Ignorar `.git`, `.venv`, `__pycache__`, tests y archivos temporales.

- [ ] **Step 3: Crear `render.yaml` en la raíz del proyecto**

Declarar servicio web `natbell-backend` con health check en `/api/health`, comando de inicio y lista de variables de entorno requeridas.

- [ ] **Step 4: Crear `backend/.env.production.example`**

Documentar exhaustivamente cada variable requerida en producción (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_SANDBOX=False`, `JWT_SECRET_KEY`, `ALLOWED_ORIGINS`).

---

### Task 3: Configuración y Optimización Frontend (Vercel)

**Files:**
- Create: `frontend/vercel.json`
- Create: `frontend/.env.production.example`

**Interfaces:**
- Consumes: Next.js 14 App Router.
- Produces: Reglas de caching para Edge Network de Vercel, cabeceras de seguridad frontend y especificación de variables de entorno.

- [ ] **Step 1: Crear `frontend/vercel.json`**

Configurar headers de seguridad para el frontend (X-Frame-Options, CSP inicial, X-Content-Type-Options) y control de caché para assets `/_next/static/*`.

- [ ] **Step 2: Crear `frontend/.env.production.example`**

Documentar variable `NEXT_PUBLIC_API_URL` apuntando al backend en Render y notas sobre build en Vercel.

- [ ] **Step 3: Validar build de Next.js en modo producción**

Run: `npm run build` (en `frontend`)  
Expected: Compilación exitosa de todas las rutas sin errores.

---

### Task 4: Script de Smoke Tests Automatizados E2E de Pre/Post-Deploy

**Files:**
- Create: `scripts/smoke_test_production.py`

**Interfaces:**
- Consumes: Endpoints públicos y protegidos de FastAPI (`/api/health`, `/api/products`, `/api/shipping/quote`, `/api/admin/orders`).
- Produces: Reporte en consola en tiempo real validando la salud del backend local o en la nube en segundos.

- [ ] **Step 1: Crear `scripts/smoke_test_production.py`**

Implementar verificador CLI con argumentos `--target` (por defecto `http://localhost:8000`) y timeout configurable:
1. Health check y versión de fase (`/api/health` -> `status == "ok"`, `phase == 8`).
2. Cabeceras de seguridad presentes en respuesta.
3. Catálogo público responde (`/api/products`, `/api/categories`, `/api/brands`).
4. Cotizador de envíos operativo (`/api/shipping/quote?postal_code=1000`).
5. Seguridad Admin verificada (intento no autenticado a `/api/admin/orders` retorna 401).

- [ ] **Step 2: Probar el smoke test contra el backend local**

Run: `python scripts/smoke_test_production.py --target http://localhost:8000` (o mock ASGI)  
Expected: Todas las comprobaciones en verde (`[PASS]`).

---

### Task 5: Documentación Integral de Despliegue y Certificación Final

**Files:**
- Create: `docs/DEPLOY_PRODUCCION.md`
- Modify: `docs/FASES_PROYECTO.md`

**Interfaces:**
- Consumes: Toda la arquitectura de la Fase 8 implementada.
- Produces: Manual operativo paso a paso para el deploy en Render y Vercel, checklist de credenciales productivas de MercadoPago y sellado de Code Review.

- [ ] **Step 1: Redactar `docs/DEPLOY_PRODUCCION.md`**

Detallar:
1. Conexión de GitHub con Render (Web Service, configuración de variables, health check).
2. Conexión de GitHub con Vercel (Root directory: `frontend`, variable `NEXT_PUBLIC_API_URL`).
3. Paso a producción de MercadoPago (obtención de `APP_USR-...`, registro de URL del webhook en el panel de desarrollador de MercadoPago, desactivación de sandbox).
4. Verificación de Supabase Storage público (`products`).

- [ ] **Step 2: Actualizar `docs/FASES_PROYECTO.md`**

Reflejar la Fase 8 como completada con sus entregables y criterios de aceptación.

- [ ] **Step 3: Ejecutar suite de calidad y certificar**

Run:
1. `ruff check app tests` (en backend)
2. `pytest` (en backend)
3. `npm run lint` (en frontend)
4. `npm test` (en frontend)
5. `python scripts/approve_code_review.py`  
Expected: Todo aprobado y commit certificado.
