"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function RecentOrdersCard({ recentOrders }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#DE1B76]" />
          <span>Pedidos Recientes</span>
        </h2>
        <Link
          href="/admin/pedidos"
          className="text-xs font-semibold text-[#DE1B76] hover:text-[#c21464] hover:underline flex items-center gap-1"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!recentOrders || recentOrders.length === 0 ? (
        <p className="text-xs text-zinc-500 py-6 text-center">
          No hay órdenes registradas aún.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {recentOrders.map((ord) => (
            <div
              key={ord.order_number}
              className="py-3 flex items-center justify-between text-xs"
            >
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
  );
}
