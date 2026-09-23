"use client";

import { Search } from "lucide-react";

export const STATUS_FILTERS = [
  { label: "Todas las órdenes", value: "all" },
  { label: "Por despachar (Pagados)", value: "paid" },
  { label: "Pendientes de pago", value: "pending" },
  { label: "En camino (Enviados)", value: "shipped" },
  { label: "Entregados", value: "delivered" },
  { label: "Todos los confirmados", value: "confirmed" },
];

export default function OrderFilterTabs({
  selectedStatus,
  onSelectStatus,
  search,
  onSearchChange,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelectStatus(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === tab.value
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-64">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por orden o cliente..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}
