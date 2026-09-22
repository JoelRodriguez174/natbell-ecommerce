"use client";

import { Truck, Lock, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export default function CartOrderSummary({
  totalItemsCount,
  subtotalAmount,
  quote,
  grandTotal,
  cuotaTotal,
  onProceedToCheckout,
}) {
  return (
    <div className="space-y-6">
      {/* Tarjeta de Resumen de Compra */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100">
          Resumen de la orden
        </h3>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal productos ({totalItemsCount})</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(subtotalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#5EB82D]" />
              <span>Costo de envío</span>
            </span>
            {quote ? (
              <span className="font-semibold text-gray-900">
                {formatCurrency(quote.cost)}
              </span>
            ) : (
              <span className="text-xs text-[#DE1B76] font-medium bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                Calculá con tu CP arriba
              </span>
            )}
          </div>

          {quote && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center justify-between">
              <span className="font-medium">{quote.zone_name}</span>
              <span>Llega en ~{quote.estimated_days} días</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
            <span className="text-base font-bold text-gray-950">Total</span>
            <div className="text-right">
              <span className="text-2xl font-black text-gray-950 block tracking-tight">
                {formatCurrency(grandTotal)}
              </span>
              <span className="text-[11px] text-gray-500">
                O en 3 cuotas de {formatCurrency(cuotaTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Iniciar Compra */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="w-full h-12 bg-[#DE1B76] hover:bg-[#c21464] text-white text-sm font-black rounded-xl shadow-md hover:shadow-[#DE1B76]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            data-testid="proceed-to-checkout-btn"
          >
            <Lock className="w-4 h-4" />
            <span>Iniciar Compra Segura</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Transacción cifrada con MercadoPago</span>
          </div>
        </div>
      </div>

      {/* Beneficios adicionales */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <CreditCard className="w-4 h-4 text-zinc-900" />
          <span>Medios de Pago</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Aceptamos todas las tarjetas de crédito, débito, dinero en cuenta de MercadoPago y transferencias bancarias directas.
        </p>
      </div>
    </div>
  );
}
