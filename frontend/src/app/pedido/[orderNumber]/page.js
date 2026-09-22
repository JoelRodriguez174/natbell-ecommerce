"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { getOrderStatus } from "../../../lib/api";
import OrderTrackingView from "../../../components/checkout/OrderTrackingView";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber) return;

    let isMounted = true;
    setIsLoading(true);

    getOrderStatus(orderNumber)
      .then((data) => {
        if (isMounted) {
          setOrder(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "No se encontró el pedido indicado.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>
        </div>

        {isLoading && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#DE1B76] animate-spin" />
            <p className="text-xs text-zinc-500">Buscando información de tu pedido...</p>
          </div>
        )}

        {error && (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Pedido no encontrado
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
            <Link
              href="/productos"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#DE1B76] hover:bg-[#c21464] text-white text-xs font-semibold"
            >
              Explorar Catálogo
            </Link>
          </div>
        )}

        {!isLoading && !error && order && <OrderTrackingView order={order} />}
      </div>
    </div>
  );
}
