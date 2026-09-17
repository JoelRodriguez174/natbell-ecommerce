#!/usr/bin/env python3
"""
Script de Smoke Testing Automatizado E2E de Pre y Post-Despliegue.
Proyecto: Natbell E-commerce (Los Arrayanes) - Fase 8

Uso:
  python scripts/smoke_test_production.py [--target http://localhost:8000] [--timeout 10]
"""

import argparse
import contextlib
import sys

import httpx

# Asegurar codificación utf-8 en terminales de Windows
if sys.platform == "win32":
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")


class SmokeTestRunner:
    def __init__(self, base_url: str, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.results: list[tuple[str, bool, str]] = []

    def record(self, test_name: str, passed: bool, message: str = ""):
        self.results.append((test_name, passed, message))
        icon = "✅" if passed else "❌"
        status_text = "PASS" if passed else "FAIL"
        extra = f" -> {message}" if message else ""
        print(f"  {icon} [{status_text}] {test_name}{extra}")

    def run_all(self) -> bool:
        print("\n" + "=" * 75)
        print("🚀 INICIANDO SMOKE TESTS E2E — NATBELL API (FASE 8)")
        print(f"🎯 Target URL: {self.base_url}")
        print(f"⏱️  Timeout: {self.timeout}s")
        print("=" * 75 + "\n")

        with httpx.Client(base_url=self.base_url, timeout=self.timeout) as client:
            self._test_root(client)
            self._test_health_check(client)
            self._test_security_headers(client)
            self._test_cors_preflight(client)
            self._test_catalog_taxonomies(client)
            self._test_catalog_products(client)
            self._test_shipping_quote(client)
            self._test_admin_security_lockdown(client)

        print("\n" + "=" * 75)
        total = len(self.results)
        passed = sum(1 for _, p, _ in self.results if p)
        failed = total - passed

        if failed == 0:
            print(f"🎉 TODOS LOS SMOKE TESTS PASARON EXITOSAMENTE ({passed}/{total})")
            print("   El servicio cumple con todos los estándares de producción de la Fase 8.")
            print("=" * 75 + "\n")
            return True
        else:
            print(f"⚠️  SE DETECTARON FALLOS EN LOS SMOKE TESTS ({failed}/{total} fallidos)")
            print("=" * 75 + "\n")
            return False

    def _test_root(self, client: httpx.Client):
        name = "Endpoint Raíz (/)"
        try:
            res = client.get("/")
            if res.status_code == 200:
                data = res.json()
                phase = data.get("phase")
                status = data.get("status")
                if phase == 8 and status == "online":
                    self.record(name, True, f"Fase {phase}, status: {status}")
                else:
                    self.record(name, False, f"Respuesta inesperada: phase={phase}, status={status}")
            else:
                self.record(name, False, f"Status code: {res.status_code}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error de conexión: {exc}")

    def _test_health_check(self, client: httpx.Client):
        name = "Health Check (/api/health)"
        try:
            res = client.get("/api/health")
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "ok" and data.get("phase") == 8:
                    self.record(name, True, "Status ok, Fase 8 confirmada")
                else:
                    self.record(name, False, f"Respuesta incorrecta: {data}")
            else:
                self.record(name, False, f"Status code: {res.status_code}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error de conexión: {exc}")

    def _test_security_headers(self, client: httpx.Client):
        name = "Cabeceras Defensivas HTTP (HSTS, CSP, X-Frame-Options)"
        try:
            res = client.get("/api/health")
            headers = res.headers
            missing = []
            if headers.get("x-frame-options") != "DENY":
                missing.append("X-Frame-Options!=DENY")
            if headers.get("x-content-type-options") != "nosniff":
                missing.append("X-Content-Type-Options!=nosniff")
            if "strict-transport-security" not in headers:
                missing.append("Strict-Transport-Security")
            if "content-security-policy" not in headers:
                missing.append("Content-Security-Policy")

            if not missing:
                self.record(name, True, "HSTS, CSP, nosniff, DENY presentes")
            else:
                self.record(name, False, f"Cabeceras faltantes/inválidas: {', '.join(missing)}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")

    def _test_cors_preflight(self, client: httpx.Client):
        name = "CORS Preflight (OPTIONS /api/products)"
        try:
            res = client.options(
                "/api/products",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET",
                },
            )
            if res.status_code == 200:
                origin = res.headers.get("access-control-allow-origin")
                self.record(name, True, f"Allow-Origin: {origin}")
            else:
                self.record(name, False, f"Preflight falló con status {res.status_code}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")

    def _test_catalog_taxonomies(self, client: httpx.Client):
        name = "Catálogo Público: Categorías y Marcas"
        try:
            res_cat = client.get("/api/categories")
            res_brands = client.get("/api/brands")
            if res_cat.status_code == 200 and res_brands.status_code == 200:
                cats = res_cat.json()
                brands = res_brands.json()
                self.record(
                    name,
                    True,
                    f"{len(cats)} categorías y {len(brands)} marcas disponibles",
                )
            else:
                self.record(
                    name,
                    False,
                    f"Categorías: {res_cat.status_code}, Marcas: {res_brands.status_code}",
                )
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")

    def _test_catalog_products(self, client: httpx.Client):
        name = "Catálogo Público: Consulta Paginada de Productos"
        try:
            res = client.get("/api/products?page=1&per_page=5")
            if res.status_code == 200:
                data = res.json()
                items = data.get("items", []) if isinstance(data, dict) else data
                self.record(name, True, f"Catálogo activo ({len(items)} items retornados)")
            else:
                self.record(name, False, f"Status code: {res.status_code}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")

    def _test_shipping_quote(self, client: httpx.Client):
        name = "Cotizador de Envíos (/api/shipping/quote?postal_code=1000)"
        try:
            res = client.get("/api/shipping/quote?postal_code=1000")
            if res.status_code == 200:
                data = res.json()
                cost = data.get("cost")
                zone = data.get("zone_name")
                self.record(name, True, f"Zona: {zone}, Costo: ${cost}")
            else:
                self.record(name, False, f"Status code: {res.status_code}")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")

    def _test_admin_security_lockdown(self, client: httpx.Client):
        name = "Defensa de Endpoints Admin sin Autenticación (401 Rejection)"
        try:
            res = client.get("/api/admin/orders")
            if res.status_code == 401:
                self.record(name, True, "Bloqueo 401 Unauthorized verificado correctamente")
            else:
                self.record(name, False, f"Vulnerabilidad potencial: status {res.status_code} en vez de 401")
        except Exception as exc:  # noqa: BLE001
            self.record(name, False, f"Error: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Smoke testing automatizado para producción.")
    parser.add_argument(
        "--target",
        type=str,
        default="http://localhost:8000",
        help="URL base del backend a testear (por defecto: http://localhost:8000)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Timeout en segundos para cada petición HTTP (por defecto: 10.0)",
    )

    args = parser.parse_args()
    runner = SmokeTestRunner(base_url=args.target, timeout=args.timeout)
    success = runner.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
