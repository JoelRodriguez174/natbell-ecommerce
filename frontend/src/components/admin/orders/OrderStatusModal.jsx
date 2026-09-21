"use client";

import { X, Truck, ExternalLink, Loader2 } from "lucide-react";

export default function OrderStatusModal({
  selectedOrder,
  onClose,
  newStatus,
  onStatusChange,
  trackingNumber,
  onTrackingNumberChange,
  isUpdating,
  isGeneratingAndreani,
  onGenerateAndreaniShipment,
  onSubmit,
}) {
  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Actualizar Pedido {selectedOrder.order_number}
            </h2>
            <p className="text-[11px] text-zinc-500">
              Cliente: {selectedOrder.customer_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nuevo Estado
            </label>
            <select
              value={newStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-semibold"
            >
              <option value="paid">Pagado (Listo para embalar / despachar)</option>
              <option value="shipped">Enviado (En camino)</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Sección Integración Logística Andreani */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                <Truck className="w-4 h-4" />
                <span>Logística Andreani Oficial</span>
              </div>
              {trackingNumber && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                  Generado
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Registra el paquete en la API de Andreani PyME, genera la guía oficial y notifica por email al cliente automáticamente.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onGenerateAndreaniShipment}
                disabled={isGeneratingAndreani || isUpdating}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAndreani ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando en Andreani...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5" />
                    <span>Generar número de seguimiento</span>
                  </>
                )}
              </button>

              {trackingNumber && (
                <a
                  href={`https://www.andreani.com/#!/informacionEnvio/${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver en Andreani</span>
                </a>
              )}
            </div>
          </div>

          {newStatus === "shipped" && (
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Código de Seguimiento (Tracking Number)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => onTrackingNumberChange(e.target.value)}
                placeholder="Ej: AR123456789 (Correo Arg / Andreani)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                El cliente podrá consultar este código en el tracking público.
              </p>
            </div>
          )}

          {/* Indicaciones de Entrega del Cliente (Solo Lectura) */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Indicaciones de Entrega del Cliente
            </label>
            {selectedOrder.notes ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                &ldquo;{selectedOrder.notes}&rdquo;
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">
                El cliente no agregó notas ni indicaciones especiales para la entrega.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
