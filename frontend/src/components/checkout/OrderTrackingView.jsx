"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const STEPS = [
  { id: "pending", label: "Pendiente", icon: Clock },
  { id: "paid", label: "Pago Acreditado", icon: CheckCircle2 },
  { id: "shipped", label: "En Camino", icon: Truck },
  { id: "delivered", label: "Entregado", icon: PackageCheck },
];

function getStepIndex(status) {
  switch (status) {
    case "pending":
    case "payment_pending":
      return 0;
    case "paid":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

export default function OrderTrackingView({ order }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const currentIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  const handleCopy = () => {
    if (order.tracking_number && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Cabecera del pedido */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#DE1B76] font-bold">
              Natbell Cosmética
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Pedido {order.order_number}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Comprador: <span className="font-medium text-zinc-700 dark:text-zinc-300">{order.customer_name}</span> ({order.customer_email})
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto bg-rose-50 text-[#DE1B76] border border-rose-200">
            <span>Estado: {isCancelled ? "Cancelado" : STEPS[currentIndex]?.label}</span>
          </div>
        </div>

        {/* Barra de progreso visual */}
        {!isCancelled ? (
          <div className="pt-8 pb-4">
            <div className="relative flex justify-between items-center">
              {/* Línea conectora de fondo */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-zinc-200 dark:bg-zinc-800 -z-0" />
              {/* Línea conectora activa */}
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-[#DE1B76] transition-all duration-500 -z-0"
                style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isPassed
                          ? "bg-[#DE1B76] border-[#DE1B76] text-white shadow-md shadow-[#DE1B76]/20"
                          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400"
                      } ${isCurrent ? "ring-4 ring-[#DE1B76]/20" : ""}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium text-center hidden sm:block ${
                        isPassed
                          ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 mt-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>Este pedido fue cancelado o no completó el proceso de pago.</span>
          </div>
        )}
      </div>

      {/* Tarjeta de seguimiento oficial Andreani */}
      {order.tracking_number && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-600/20">
                <Truck className="w-3.5 h-3.5" />
                <span>Envío gestionado por Andreani</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Código de seguimiento oficial:
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black text-blue-950 dark:text-blue-100 tracking-wider">
                  {order.tracking_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  title="Copiar código al portapapeles"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <a
              href={
                order.tracking_url ||
                `https://www.andreani.com/#!/informacionEnvio/${order.tracking_number}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Rastrear paquete en Andreani</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Detalle de productos y entrega */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Productos comprados */}
        <div className="md:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            Productos Adquiridos
          </h3>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(order.items || []).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.product_name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.variant_name ? `Variante: ${item.variant_name}` : `SKU: ${item.sku}`}
                  </p>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Costo de envío</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              <span>Total Abonado</span>
              <span className="text-[#DE1B76]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Datos de envío */}
        <div className="md:col-span-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Dirección de Entrega
            </h3>

            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">
                  Dirección:
                </span>
                <p className="font-medium text-zinc-900 dark:text-zinc-200">
                  {order.shipping_address}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">
                  Localidad y Provincia:
                </span>
                <p className="font-medium text-zinc-900 dark:text-zinc-200">
                  {order.shipping_city}, {order.shipping_province} (CP {order.shipping_postal_code})
                </p>
              </div>

              {order.notes && (
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">
                    Notas de entrega:
                  </span>
                  <p className="italic text-zinc-700 dark:text-zinc-300">
                    &ldquo;{order.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 dark:text-zinc-400">
            💡 Guardá tu número de orden <strong>{order.order_number}</strong> para futuras consultas o comunicate con nosotros ante cualquier duda.
          </div>
        </div>
      </div>
    </div>
  );
}
