"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    online: false,
    data: null,
    error: null,
  });

  const checkHealth = async () => {
    setBackendStatus((prev) => ({ ...prev, loading: true, error: null }));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setBackendStatus({
        loading: false,
        online: true,
        data,
        error: null,
      });
    } catch (err) {
      setBackendStatus({
        loading: false,
        online: false,
        data: null,
        error: err.message || "No se pudo conectar con el servidor",
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const phases = [
    {
      id: 1,
      title: "Fase 1: Scaffolding y Conectividad Inicial",
      desc: "Estructura modular limpia, backend FastAPI con CORS, frontend Next.js con Tailwind v4 y health checks operativos.",
      status: "completed",
    },
    {
      id: 2,
      title: "Fase 2: Base de Datos & Supabase",
      desc: "Modelado relacional en PostgreSQL (Supabase), scripts de migración, índices y datos semilla de marcas y categorías.",
      status: "next",
    },
    {
      id: 3,
      title: "Fase 3: Backend — Catálogo y APIs Públicas",
      desc: "Endpoints de productos con soporte para variantes, filtros por categoría/marca, búsqueda y ordenamiento.",
      status: "pending",
    },
    {
      id: 4,
      title: "Fase 4: Frontend — Catálogo y Diseño",
      desc: "Storefront moderno, grilla de productos interactiva, buscador, filtros laterales y página de detalle con variantes.",
      status: "pending",
    },
    {
      id: 5,
      title: "Fase 5: Carrito y Cotizador de Envíos",
      desc: "Carrito de compras en localStorage (sin registro requerido) y cálculo de tarifas de envío por zonas y códigos postales.",
      status: "pending",
    },
    {
      id: 6,
      title: "Fase 6: Checkout, MercadoPago y Webhooks",
      desc: "Generación de órdenes, integración con MercadoPago Checkout Pro, verificación de pagos e impacto en stock.",
      status: "pending",
    },
    {
      id: 7,
      title: "Fase 7: Panel de Administración",
      desc: "Autenticación segura JWT para admin, CRUD completo de catálogo, gestión de pedidos y configuración de tarifas.",
      status: "pending",
    },
    {
      id: 8,
      title: "Fase 8: Deploy y Puesta en Producción",
      desc: "Despliegue continuo en Render (Backend) y Vercel (Frontend), variables de entorno productivas y pruebas finales.",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 sm:p-12">
      {/* Header / Brand */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-slate-800/80 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-rose-950/50">
            NB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Natbell
            </h1>
            <p className="text-xs text-slate-400">
              Cosmética, Barbería & Peluquería Profesional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Fase 1: Scaffolding
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl flex-1 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-3 py-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            E-commerce Modular en Construcción
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Avanzando paso a paso con paciencia y calidad. La base del proyecto ha
            sido inicializada limpiamente para garantizar un desarrollo sólido y modular.
          </p>
        </section>

        {/* Status Card: Backend Connection */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  backendStatus.loading
                    ? "bg-amber-400 animate-pulse"
                    : backendStatus.online
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                    : "bg-rose-500"
                }`}
              />
              <h3 className="text-base font-semibold text-white">
                Estado de Conexión con el Backend (FastAPI)
              </h3>
            </div>

            <button
              onClick={checkHealth}
              disabled={backendStatus.loading}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition disabled:opacity-50"
            >
              {backendStatus.loading ? "Comprobando..." : "Comprobar conexión"}
            </button>
          </div>

          {backendStatus.loading ? (
            <div className="py-6 text-center text-sm text-slate-400">
              Conectando con el servidor backend en http://localhost:8000/api/health...
            </div>
          ) : backendStatus.online ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-sm">
                <p className="font-semibold text-emerald-200">
                  {backendStatus.data?.message || "Servidor backend conectado correctamente."}
                </p>
                <div className="mt-2 text-xs text-emerald-400/80 flex flex-wrap gap-x-6 gap-y-1">
                  <span>API: <strong>{backendStatus.data?.app}</strong></span>
                  <span>Fase actual: <strong>{backendStatus.data?.phase}</strong></span>
                  <span>Status: <strong>{backendStatus.data?.status}</strong></span>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-slate-400 pt-1">
                <span>Documentación interactiva disponible en:</span>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
                >
                  http://localhost:8000/docs (Swagger UI)
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-sm space-y-2">
              <p className="font-semibold text-rose-200">
                No se pudo establecer conexión con el backend en http://localhost:8000.
              </p>
              <p className="text-xs text-rose-300/80">
                Asegúrate de que el servidor de FastAPI esté iniciado ejecutando:
              </p>
              <pre className="bg-slate-950/80 text-slate-300 text-xs p-2.5 rounded-lg border border-slate-800 font-mono overflow-x-auto">
                cd backend ; .\venv\Scripts\activate ; uvicorn app.main:app --reload
              </pre>
            </div>
          )}
        </section>

        {/* Roadmap by Phases */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Hoja de Ruta por Fases
            </h3>
            <span className="text-xs text-slate-400">
              Progreso: 1 de 8 fases listas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {phases.map((phase) => {
              const isDone = phase.status === "completed";
              const isNext = phase.status === "next";

              return (
                <div
                  key={phase.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? "bg-slate-900/80 border-emerald-500/40 text-slate-200 shadow-sm"
                      : isNext
                      ? "bg-slate-900/60 border-rose-500/40 text-slate-300 ring-1 ring-rose-500/20"
                      : "bg-slate-900/30 border-slate-800/60 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isNext
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isDone ? "Completada" : isNext ? "Siguiente Fase" : "Pendiente"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      #{phase.id}
                    </span>
                  </div>
                  <h4
                    className={`text-sm font-semibold mb-1 ${
                      isDone || isNext ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {phase.title}
                  </h4>
                  <p className="text-xs leading-relaxed">
                    {phase.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl border-t border-slate-800/80 pt-6 mt-8 text-center text-xs text-slate-500">
        Natbell E-commerce &bull; Belleza, Barbería & Peluquería Profesional
      </footer>
    </div>
  );
}
