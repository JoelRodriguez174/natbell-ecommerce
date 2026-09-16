"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function PagoSimuladorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderNumber = searchParams?.get("order_number") || searchParams?.get("order") || "ORD-2026-00001";
  const total = searchParams?.get("total") || "10000";

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSimulatePayment = async (status) => {
    setIsLoading(true);
    setErrorMessage(null);

    if (status === "approved") {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/webhooks/mock-payment/${encodeURIComponent(orderNumber)}`, {
          method: "POST",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error al simular pago en el backend");
        }

        router.push(`/pago/exitoso?order=${orderNumber}`);
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message);
        setIsLoading(false);
      }
    } else if (status === "pending") {
      router.push(`/pago/pendiente?order=${orderNumber}`);
    } else {
      router.push(`/pago/fallido?order=${orderNumber}`);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">
              Modo Simulador de Pasarela
            </span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Checkout Pro (Prueba Local)
            </h2>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs mb-6 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Orden de compra:</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Monto total a abonar:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(total)}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSimulatePayment("approved")}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Simular Pago Aprobado (Acredita y descuenta stock)</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSimulatePayment("pending")}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-amber-500/20 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Simular Pago Pendiente</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSimulatePayment("failure")}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-red-500/20 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Simular Pago Rechazado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
