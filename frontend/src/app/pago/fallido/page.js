"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { deleteDraftOrder } from "@/lib/api";

function PagoFallidoContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("order") || searchParams?.get("external_reference");

  useEffect(() => {
    if (orderNumber) {
      deleteDraftOrder(orderNumber);
      try {
        sessionStorage.removeItem("natbell_pending_order");
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }, [orderNumber]);

  return (
    <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 shadow-xl shadow-zinc-900/5">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
        <XCircle className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
        Natbell Cosmética
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1 mb-3">
        El Pago no se pudo completar
      </h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
        La entidad bancaria o Mercado Pago rechazó la operación o se canceló el intento de pago. No te preocupes, no se ha efectuado ningún cobro.
      </p>

      {orderNumber && (
        <div className="mb-6 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
          <span className="text-zinc-500 block mb-0.5">Identificador descartado:</span>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {orderNumber}
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-normal">
            El intento no pagado fue descartado del sistema. Tus artículos permanecen seguros en tu carrito.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/checkout"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar con otro medio de pago</span>
        </Link>

        <Link
          href="/carrito"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Revisar mi Carrito</span>
        </Link>
      </div>
    </div>
  );
}

export default function PagoFallidoPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}>
        <PagoFallidoContent />
      </Suspense>
    </div>
  );
}
