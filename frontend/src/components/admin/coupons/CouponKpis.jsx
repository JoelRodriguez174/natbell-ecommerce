"use client";

import { Ticket, CheckCircle2, Users } from "lucide-react";

export default function CouponKpis({ totalCoupons = 0, activeCoupons = 0, totalTimesUsed = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          <span>Total Cupones</span>
          <Ticket className="w-4 h-4 text-zinc-400" />
        </div>
        <p className="mt-3 text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {totalCoupons}
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          <span>Cupones Activos</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
          {activeCoupons}
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          <span>Usos Canjeados</span>
          <Users className="w-4 h-4 text-[#de1b76]" />
        </div>
        <p className="mt-3 text-3xl font-black text-[#de1b76]">
          {totalTimesUsed}
        </p>
      </div>
    </div>
  );
}
