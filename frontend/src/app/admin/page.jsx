"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import DashboardKpiGrid from "../../components/admin/dashboard/DashboardKpiGrid";
import RecentOrdersCard from "../../components/admin/dashboard/RecentOrdersCard";
import LowStockAlertsCard from "../../components/admin/dashboard/LowStockAlertsCard";

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
            Bienvenido de nuevo,{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {adminUser?.name || "Administrador"}
            </span>
            . Esto es lo que está pasando en Natbell hoy.
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
      <DashboardKpiGrid metrics={metrics} />

      {/* Two Column Layout: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersCard recentOrders={metrics?.recent_orders} />
        <LowStockAlertsCard lowStockVariants={metrics?.low_stock_variants} />
      </div>
    </div>
  );
}
