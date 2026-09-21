"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function LowStockAlertsCard({ lowStockVariants }) {
  return (
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

      {!lowStockVariants || lowStockVariants.length === 0 ? (
        <p className="text-xs text-zinc-500 py-6 text-center">
          Todo el inventario se encuentra en niveles saludables.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {lowStockVariants.map((v) => (
            <div
              key={v.id}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {v.product_name}
                </p>
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
  );
}
