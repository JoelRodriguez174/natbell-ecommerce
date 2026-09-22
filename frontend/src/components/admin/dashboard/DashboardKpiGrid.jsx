"use client";

import { DollarSign, PackageCheck, Truck, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function DashboardKpiGrid({ metrics }) {
  return (
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
          <p className="text-2xl font-black text-[#DE1B76] mt-1">
            {metrics?.paid_orders || 0}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Pagadas listas para envío
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#DE1B76] flex items-center justify-center">
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
  );
}
