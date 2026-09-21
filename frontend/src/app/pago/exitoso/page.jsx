"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { useCartStore } from "../../../store/useCartStore";

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("order") || searchParams?.get("external_reference");
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("natbell_checkout_draft");
        sessionStorage.removeItem("natbell_pending_order");
      } catch (e) {
        // ignore
      }
    }
  }, [clearCart]);


  return (
    <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 shadow-xl shadow-zinc-900/5">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
        Natbell Cosmética
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1 mb-3">
        ¡Pago Acreditado con Éxito!
      </h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
        Muchas gracias por tu compra. Ya estamos preparando tu pedido para despacharlo lo antes posible.
      </p>

      {orderNumber && (
        <div className="mb-8 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
          <span className="text-zinc-500 block mb-0.5">Identificador de tu Pedido:</span>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {orderNumber}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {orderNumber && (
          <Link
            href={`/pedido/${orderNumber}`}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <Package className="w-4 h-4" />
            <span>Ver Seguimiento del Pedido</span>
          </Link>
        )}

        <Link
          href="/productos"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs transition-colors"
        >
          <span>Continuar Comprando</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}>
        <PagoExitosoContent />
      </Suspense>
    </div>
  );
}

