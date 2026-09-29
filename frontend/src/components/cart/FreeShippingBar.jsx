"use client";

import { Truck, CheckCircle2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export default function FreeShippingBar({
  subtotal = 0,
  threshold = FREE_SHIPPING_THRESHOLD,
}) {
  const currentSubtotal = Math.max(0, Number(subtotal) || 0);
  const targetThreshold = Number(threshold) || FREE_SHIPPING_THRESHOLD;
  const isFree = currentSubtotal >= targetThreshold;
  const remaining = Math.max(0, targetThreshold - currentSubtotal);
  const percentage = Math.min(100, Math.round((currentSubtotal / targetThreshold) * 100));

  if (isFree) {
    return (
      <div
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 p-4 shadow-xs transition-all duration-300 animate-in fade-in"
        data-testid="free-shipping-achieved"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <span>¡Felicidades! Tenés Envío Gratis en tu compra</span>
                <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-500 animate-pulse" />
              </p>
              <p className="text-xs text-emerald-700/90 font-medium">
                Alcanzaste el monto promocional de {formatCurrency(targetThreshold)}.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
            100% Bonificado
          </span>
        </div>

        {/* Barra al 100% */}
        <div className="mt-3 w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-2xl bg-white border border-rose-100/80 p-4 shadow-xs transition-all duration-300"
      data-testid="free-shipping-progress"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#DE1B76] border border-rose-100 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-gray-900">
            ¡Agregá{" "}
            <span className="text-[#DE1B76] font-bold">
              {formatCurrency(remaining)}
            </span>{" "}
            más para conseguir <span className="font-bold underline decoration-[#DE1B76]">Envío Gratis</span>!
          </p>
        </div>
        <span className="text-xs font-bold text-gray-500 shrink-0">
          {percentage}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-[#DE1B76] via-rose-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(4, percentage)}%` }}
        />
      </div>
    </div>
  );
}
