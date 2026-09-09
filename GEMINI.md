# Reglas y Metodología del Proyecto (Los Arrayanes E-commerce)

## 📌 Metodología de Trabajo: Estricto Desarrollo por Fases
- **Trabajo fase por fase:** Bajo ninguna circunstancia se debe implementar o abarcar todo el proyecto de una sola vez.
- **Enfoque modular e incremental:** Se debe trabajar exclusivamente en la fase actual activa, verificando y validando cada entrega antes de pasar a la siguiente.
- **🧪 Testeo y verificación modular obligatoria:**
  - En cada fase se deben diseñar y ejecutar las pruebas pertinentes (tests unitarios/integración con `pytest`, validación de schemas Pydantic, chequeos de endpoints/migraciones, o pruebas de componentes frontend).
  - Ninguna fase se considerará terminada sin evidencia explícita de que sus módulos funcionan correctamente y de manera desacoplada.
- **📦 Consulta previa obligatoria de librerías (en todas las fases sin excepción):** Si surge la conveniencia o necesidad de agregar nuevas librerías a medida que se avanza en cualquier fase, se debe consultar y explicar primero al usuario antes de modificar o instalar dependencias, para analizar su propósito y planificar posibles adaptaciones y refactorizaciones de código.
- **Esperar confirmación explícita:** No se debe escribir código de implementación de ninguna fase hasta que el usuario dé la indicación explícita de comenzar.
- **Consultar antes de avanzar:** Siempre confirmar con el usuario mostrando los resultados de las pruebas antes de dar por cerrada una fase e iniciar la siguiente.

---

## 🧩 Arquitectura Limpia y Modularización Atómica
- **Estructura atomizada y desacoplada:** Ningún archivo debe ser monolítico ni acumular múltiples responsabilidades.
- **Frontend (Atomic & Component-Driven):**
  - Componentes atómicos pequeños, reutilizables y con una única responsabilidad (`components/ui` para átomos como botones, inputs, badges, skeletons).
  - Moléculas y organismos organizados por dominio (`components/product`, `components/cart`, `components/checkout`).
  - **Gestión de estado global aislada con Zustand (`src/store/`):** stores modulares (`useCartStore.js` con middleware `persist` en `localStorage`, `useShippingStore.js`, etc.) para desacoplar completamente la lógica de negocio de los componentes de UI sin prop drilling ni Context Providers anidados.
  - **Server State y Consumo de APIs con TanStack Query (`@tanstack/react-query`):** consumo de endpoints de FastAPI con caché declarativa (*stale-while-revalidate*), deduplicación de requests, manejo de estados asíncronos (`isLoading`, `isError`), paginación fluida y mutaciones con auto-invalidación en el panel admin. Separa estrictamente Server State (TanStack Query) de Client State (Zustand).
- **Backend (Clean Layered Architecture):**
  - Separación estricta de capas: **Routers** (HTTP puro y validación básica) ➔ **Services** (lógica de negocio) ➔ **Models/Schemas** (contratos Pydantic) ➔ **Database** (acceso a Supabase).
  - Módulos utilitarios atómicos (`utils/slug.py`, `utils/order_number.py`) como funciones puras sin dependencias cruzadas.

---

## 🗺️ Mapa de Fases Oficial
1. **Fase 1: Scaffolding y Conectividad Inicial** *(Completada)*
   - Setup modular FastAPI + Next.js 14 (App Router) + Tailwind CSS v4 + Health checks.
2. **Fase 2: Base de Datos & Supabase** *(Fase actual / siguiente)*
   - Modelado relacional PostgreSQL en Supabase, migraciones DDL, índices y datos semilla de marcas y categorías.
3. **Fase 3: Backend — Catálogo y APIs Públicas**
   - Endpoints públicos de productos, variantes, filtros (categoría, marca, precio), paginación y búsqueda.
4. **Fase 4: Frontend — Catálogo y Diseño**
   - Storefront moderno, grilla interactiva, filtros laterales, buscador y detalle de producto con selector de variantes.
5. **Fase 5: Carrito y Cotizador de Envíos**
   - Carrito en `localStorage` (guest checkout sin registro previo) y cotizador de envíos con tarifas por zonas y rangos de código postal.
6. **Fase 6: Checkout, MercadoPago y Webhooks**
   - Creación de pedidos (`orders`), integración con MercadoPago Checkout Pro, webhooks asíncronos (QStash / IPN) y actualización de stock.
7. **Fase 7: Panel de Administración**
   - Auth admin con JWT, dashboard, CRUD completo de catálogo, pedidos y configuración de tarifas.
8. **Fase 8: Deploy y Puesta en Producción**
   - Despliegue en Render (Backend) y Vercel (Frontend), variables de entorno productivas y pruebas finales.

---

## 📚 Documentación de Referencia
- Guía detallada de fases: [`docs/FASES_PROYECTO.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/FASES_PROYECTO.md)
- Especificación técnica completa: [`docs/specs/2026-09-08-ecommerce-belleza-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/specs/2026-09-08-ecommerce-belleza-design.md)
- Hoja de ruta en frontend: [`frontend/src/app/page.js`](file:///c:/Users/Enekon/Desktop/Ecommerce/frontend/src/app/page.js)
