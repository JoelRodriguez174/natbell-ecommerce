# Fase 2: Base de Datos & Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar y validar el modelado relacional completo en PostgreSQL (Supabase) mediante migraciones DDL atomizadas, datos semilla reales del negocio, cliente singleton desacoplado en FastAPI con `supabase-py` y validación de schemas con Pydantic y `pytest`.

**Architecture:** Estructura modular y desacoplada: scripts DDL y Seeds separados por dominio en `database/`, cliente singleton ligero en `backend/app/database.py`, contratos de datos en `backend/app/models/` y suite de tests con `pytest` para garantizar integridad y tipado sin dependencias cruzadas.

**Tech Stack:** PostgreSQL (Supabase), Python 3.11+, FastAPI, `supabase` (SDK v2.31.0), `pydantic` v2, `pytest` & `pytest-asyncio`.

**Spec:** [`docs/specs/2026-09-08-ecommerce-belleza-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/specs/2026-09-08-ecommerce-belleza-design.md) y [`docs/FASES_PROYECTO.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/FASES_PROYECTO.md).

## Global Constraints
- No usar archivos monolíticos: cada tabla y dominio debe estar modularizado.
- Acceso a base de datos mediante SDK oficial `supabase` (PostgREST HTTPS) + Pydantic.
- Testeo modular obligatorio con `pytest` antes de dar por cerrada la fase.
- Consultar previamente cualquier librería nueva antes de modificar código (cumplido).

---

### Task 1: Configurar Dependencias y Entorno de Testing (`pytest`, `supabase`)

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/config.py`
- Create: `backend/.env.example`

**Interfaces:**
- Produces: `Settings` con `supabase_url`, `supabase_key` en `backend/app/config.py`.

- [x] **Step 1: Actualizar `backend/requirements.txt`**
Agregar `supabase>=2.31.0`, `pytest>=8.0.0` y `pytest-asyncio>=0.23.0`.

- [x] **Step 2: Instalar `pytest` y `pytest-asyncio` en el entorno**
Run: `pip install pytest pytest-asyncio`

- [x] **Step 3: Actualizar `backend/app/config.py`**
Agregar variables opcionales/configurables `supabase_url: str = ""` y `supabase_service_key: str = ""` a la clase `Settings`.

- [x] **Step 4: Crear `backend/.env.example`**
Documentar variables requeridas de Supabase para desarrollo.

- [x] **Step 5: Verificar instalación de pytest**
Run: `pytest --version`
Expected: pytest versión 8.x instalado y funcional.

- [x] **Step 6: Commit**
```bash
git add backend/requirements.txt backend/app/config.py backend/.env.example
git commit -m "feat(phase-2): configure supabase settings and test dependencies"
```

---

### Task 2: Cliente Singleton de Base de Datos y Test Unitario

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_database_client.py`

**Interfaces:**
- Produces: `get_supabase_client()` en `backend/app/database.py`.

- [x] **Step 1: Escribir test de inicialización del cliente (`test_database_client.py`)**
Validar que `get_supabase_client()` retorna un cliente válido o maneja limpiamente la ausencia de credenciales en modo offline.

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_database_client.py -v`
Expected: FAIL ("cannot import name 'get_supabase_client'")

- [x] **Step 3: Implementar `backend/app/database.py`**
Implementar función singleton `get_supabase_client()` con control de inicialización y manejo seguro de variables de entorno.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_database_client.py -v`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add backend/app/database.py backend/tests/conftest.py backend/tests/test_database_client.py
git commit -m "feat(phase-2): add singleton Supabase client and client unit test"
```

---

### Task 3: Schemas Pydantic Modulares (Modelos de Validación)

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/category.py`
- Create: `backend/app/models/brand.py`
- Create: `backend/app/models/product.py`
- Create: `backend/app/models/order.py`
- Create: `backend/app/models/shipping.py`
- Create: `backend/tests/test_pydantic_schemas.py`

**Interfaces:**
- Produces: Schemas de validación para `Category`, `Subcategory`, `Brand`, `Product`, `ProductVariant`, `Order`, `OrderItem`, `ShippingZone`.

- [x] **Step 1: Escribir tests unitarios de validación de schemas (`test_pydantic_schemas.py`)**
Validar checks de precios positivos, slugs válidos, estructura de variantes y cálculo de subtotales.

- [x] **Step 2: Correr test para verificar fallo inicial**
Run: `pytest backend/tests/test_pydantic_schemas.py -v`
Expected: FAIL ("cannot import models")

- [x] **Step 3: Implementar schemas modulares en `backend/app/models/`**
Implementar contratos Pydantic v2 limpios y desacoplados.

- [x] **Step 4: Correr test para verificar éxito**
Run: `pytest backend/tests/test_pydantic_schemas.py -v`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add backend/app/models/ backend/tests/test_pydantic_schemas.py
git commit -m "feat(phase-2): add atomic Pydantic schemas and schema validation tests"
```

---

### Task 4: Migraciones SQL Atomizadas (DDL)

**Files:**
- Create: `database/migrations/001_extensions.sql`
- Create: `database/migrations/002_taxonomies.sql`
- Create: `database/migrations/003_products_variants.sql`
- Create: `database/migrations/004_orders_payments.sql`
- Create: `database/migrations/005_shipping_and_admin.sql`
- Create: `database/migrations/006_indexes_and_constraints.sql`

**Interfaces:**
- Produces: Definición DDL modular completa en PostgreSQL para ejecutar en Supabase.

- [x] **Step 1: Crear `001_extensions.sql`** (uuid-ossp, pgcrypto).
- [x] **Step 2: Crear `002_taxonomies.sql`** (categories, subcategories, brands con foreign keys y constraints).
- [x] **Step 3: Crear `003_products_variants.sql`** (products, product_variants con checks de precio y stock).
- [x] **Step 4: Crear `004_orders_payments.sql`** (orders, order_items, payments con status check inmutable).
- [x] **Step 5: Crear `005_shipping_and_admin.sql`** (shipping_zones con JSONB y admin_users).
- [x] **Step 6: Crear `006_indexes_and_constraints.sql`** (índices de slugs, FKs y búsqueda rápida).
- [x] **Step 7: Commit**
```bash
git add database/migrations/
git commit -m "feat(phase-2): create atomic DDL database migrations"
```

---

### Task 5: Datos Semilla Reales Atomizados (Seeds)

**Files:**
- Create: `database/seeds/01_brands.sql` (25 marcas de Los Arrayanes: Nov, Plasma, La Puissance, etc.)
- Create: `database/seeds/02_categories_subcategories.sql` (11 categorías y ~35 subcategorías)
- Create: `database/seeds/03_shipping_zones.sql` (CABA, GBA, Interior)
- Create: `database/seeds/04_admin_user.sql` (Admin predeterminado con hash bcrypt)

**Interfaces:**
- Produces: Scripts SQL reproducibles con cláusulas `ON CONFLICT DO NOTHING / UPDATE`.

- [x] **Step 1: Crear `01_brands.sql` con las 25 marcas reales**.
- [x] **Step 2: Crear `02_categories_subcategories.sql` con las 11 categorías y subcategorías**.
- [x] **Step 3: Crear `03_shipping_zones.sql` con las zonas CABA, GBA e Interior**.
- [x] **Step 4: Crear `04_admin_user.sql` con usuario inicial seguro**.
- [x] **Step 5: Commit**
```bash
git add database/seeds/
git commit -m "feat(phase-2): create atomic seed scripts with real business data"
```

---

### Task 6: Script de Verificación y Reporte de Estado

**Files:**
- Create: `database/scripts/verify_db.py`
- Create: `backend/tests/test_migration_files.py`

**Interfaces:**
- Produces: Herramienta de verificación de migraciones y conexión a Supabase.

- [x] **Step 1: Escribir test de consistencia de archivos SQL (`test_migration_files.py`)**
Validar que todos los archivos `.sql` existan, contengan sintaxis válida básica y no tengan referencias rotas.

- [x] **Step 2: Implementar `database/scripts/verify_db.py`**
Script CLI para chequear credenciales en `.env`, conectarse a Supabase y verificar tablas existentes o generar el script unificado de migración si el usuario prefiere copiarlo en Supabase SQL Editor.

- [x] **Step 3: Correr suite completa de tests de Fase 2**
Run: `pytest backend/tests/ -v`
Expected: Todos los tests pasan (100% verde).

- [x] **Step 4: Commit**
```bash
git add database/scripts/ backend/tests/test_migration_files.py
git commit -m "feat(phase-2): add database verification script and migration file tests"
```
