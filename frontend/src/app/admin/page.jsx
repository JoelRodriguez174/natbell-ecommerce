"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  PackageCheck,
  Truck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { formatCurrency } from "../../lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminDashboardPage() {
  const { token, adminUser } = useAdminAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar las métricas del dashboard.");
      }
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs">Cargando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Resumen General
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bienvenido de nuevo, <span className="font-semibold text-zinc-800 dark:text-zinc-200">{adminUser?.name || "Administrador"}</span>. Esto es lo que está pasando en Natbell hoy.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturación */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Facturación Total
            </span>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {formatCurrency(metrics?.total_revenue || 0)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Hoy: {formatCurrency(metrics?.today_revenue || 0)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Órdenes Pagadas para Despacho */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Por Despachar
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {metrics?.paid_orders || 0}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Pagadas listas para envío
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Órdenes en Tránsito */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Envíos en Curso
            </span>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {metrics?.shipped_orders || 0}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {metrics?.delivered_orders || 0} entregadas en total
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Stock Crítico
            </span>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {metrics?.low_stock_count || 0}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Variantes con ≤ 5 unidades
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>Pedidos Recientes</span>
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!metrics?.recent_orders || metrics.recent_orders.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No hay órdenes registradas aún.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {metrics.recent_orders.map((ord) => (
                <div key={ord.order_number} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {ord.order_number}
                    </span>
                    <p className="text-[11px] text-zinc-500">{ord.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(ord.total)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        ord.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : ord.status === "shipped"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : ord.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Inventario en Alerta</span>
            </h2>
            <Link
              href="/admin/productos"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Gestionar stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!metrics?.low_stock_variants || metrics.low_stock_variants.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Todo el inventario se encuentra en niveles saludables.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {metrics.low_stock_variants.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{v.product_name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {v.variant_name} · <span className="font-mono">{v.sku}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        v.stock === 0
                          ? "bg-red-500 text-white"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {v.stock === 0 ? "Agotado" : `${v.stock} disponibles`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
