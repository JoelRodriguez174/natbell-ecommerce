# Admin Email Verification & Safe Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo de registro seguro para administradores mediante Clave Maestra de Empresa, verificación de correo electrónico con código OTP de 6 dígitos vía Resend (con simulación para desarrollo local) y recuperación de contraseña en caso de olvido.

**Architecture:** Backend FastAPI con endpoints de registro, verificación y restablecimiento de contraseña; servicio de email asíncrono con `httpx` para Resend; migración DDL en Supabase con columnas de verificación y expiración; frontend Next.js 14 con pantalla `/admin/registro` de dos pasos (datos y OTP) y enlace en `/admin/login`.

**Tech Stack:** FastAPI, Pydantic v2, PostgreSQL (Supabase), Resend API, Next.js 14, Tailwind CSS v4, Lucide React, Pytest, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-17-admin-email-verification-design.md`](file:///c:/Users/Enekon/Desktop/Ecommerce/docs/superpowers/specs/2026-09-17-admin-email-verification-design.md)

## Global Constraints
- Cero dependencias adicionales en backend (usar `httpx` ya instalado).
- Cero errores en `ruff check app tests` y `npm run lint`.
- 100% de tests unitarios y de integración pasando.
- Simulación local automática cuando no se configure `RESEND_API_KEY`.

---

### Task 1: Migración DDL y Modelos Pydantic

**Files:**
- Create: `database/migrations/008_admin_email_verification.sql`
- Modify: `backend/app/models/admin.py`
- Modify: `backend/app/config.py`

- [ ] **Step 1: Crear migración DDL `database/migrations/008_admin_email_verification.sql`**
- [ ] **Step 2: Actualizar `backend/app/config.py` con `admin_invite_code`, `resend_api_key` y `email_from`**
- [ ] **Step 3: Agregar modelos de request/response en `backend/app/models/admin.py` (`AdminRegisterRequest`, `AdminVerifyEmailRequest`, `AdminForgotPasswordRequest`, `AdminResetPasswordRequest`)**
- [ ] **Step 4: Ejecutar linter de backend (`ruff check app tests`)**

---

### Task 2: Servicio de Email Transaccional (Resend + Fallback Simulado)

**Files:**
- Create: `backend/app/services/email_service.py`
- Create: `backend/tests/test_email_service.py`

- [ ] **Step 1: Escribir tests para el servicio de email (modo simulación y modo Resend)**
- [ ] **Step 2: Implementar `EmailService` con plantillas HTML para código de verificación y recuperación de contraseña**
- [ ] **Step 3: Ejecutar `pytest backend/tests/test_email_service.py` y verificar que pase**

---

### Task 3: Endpoints de Registro, Verificación OTP y Recuperación de Contraseña en Backend

**Files:**
- Modify: `backend/app/routers/admin_auth.py`
- Create: `backend/tests/test_admin_email_verification.py`

- [ ] **Step 1: Escribir tests para registro con clave maestra, validación de código OTP, expiración, bloqueo de login no verificado y reseteo de contraseña**
- [ ] **Step 2: Implementar endpoints en `app/routers/admin_auth.py` (`/register`, `/verify-email`, `/resend-code`, `/forgot-password`, `/reset-password`) y actualizar `/login`**
- [ ] **Step 3: Ejecutar `pytest backend/tests/test_admin_email_verification.py` y suite completa de backend**
- [ ] **Step 4: Verificar linter `ruff check app tests`**

---

### Task 4: Frontend — Vista de Registro `/admin/registro` y Modal de Recuperación

**Files:**
- Create: `frontend/src/app/admin/registro/page.jsx`
- Modify: `frontend/src/app/admin/login/page.jsx`
- Create: `frontend/tests/AdminRegistration.test.jsx`

- [ ] **Step 1: Crear página de registro en dos pasos con formulario y entrada de código OTP en `frontend/src/app/admin/registro/page.jsx`**
- [ ] **Step 2: Actualizar `frontend/src/app/admin/login/page.jsx` con botón de registro y modal de "¿Olvidaste tu contraseña?"**
- [ ] **Step 3: Crear tests de integración frontend en `frontend/tests/AdminRegistration.test.jsx`**
- [ ] **Step 4: Ejecutar `npm test` y `npm run lint` en frontend**

---

### Task 5: Documentación de Variables, Smoke Tests y Certificación

**Files:**
- Modify: `backend/.env.example`
- Modify: `backend/.env.production.example`
- Run: `python scripts/approve_code_review.py`

- [ ] **Step 1: Documentar `ADMIN_INVITE_CODE`, `RESEND_API_KEY` y `EMAIL_FROM` en archivos de ejemplo**
- [ ] **Step 2: Ejecutar `npm run build` en frontend**
- [ ] **Step 3: Ejecutar Quality Gate completo y sellar aprobación del agente**
