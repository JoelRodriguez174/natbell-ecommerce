"use client";

import { Home, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selector atómico para elegir entre Envío a Domicilio o Retiro en Sucursal oficial.
 */
export default function DeliveryTypeSelector({
  deliveryType = "home",
  onSelectDeliveryType,
  className = "",
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        ¿Cómo preferís recibir tu compra? *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opción 1: Envío a Domicilio */}
        <button
          type="button"
          onClick={() => onSelectDeliveryType("home")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3",
            deliveryType === "home"
              ? "border-[#DE1B76] bg-rose-50/60 dark:bg-rose-950/20 ring-1 ring-[#DE1B76]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              deliveryType === "home"
                ? "bg-[#DE1B76] text-white"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"
            )}
          >
            <Home className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Envío a Domicilio
              </span>
              {deliveryType === "home" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#DE1B76]" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
              Recibí el paquete en la puerta de tu casa o trabajo.
            </p>
          </div>
        </button>

        {/* Opción 2: Retiro en Sucursal */}
        <button
          type="button"
          onClick={() => onSelectDeliveryType("branch")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3",
            deliveryType === "branch"
              ? "border-[#DE1B76] bg-rose-50/60 dark:bg-rose-950/20 ring-1 ring-[#DE1B76]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              deliveryType === "branch"
                ? "bg-[#DE1B76] text-white"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"
            )}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Retiro en Sucursal
              </span>
              {deliveryType === "branch" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#DE1B76]" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
              Retirá en la sucursal Andreani oficial de tu localidad.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
