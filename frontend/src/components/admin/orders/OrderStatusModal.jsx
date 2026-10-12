"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  Truck,
  ExternalLink,
  Loader2,
  Clock,
  Package,
  MapPin,
  Mail,
  Phone,
  Copy,
  Check,
  Tag,
  Receipt,
  User,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export default function OrderStatusModal({
  selectedOrder,
  onClose,
  isUpdating,
  isGeneratingAndreani,
  onGenerateAndreaniShipment,
  onSubmit,
}) {
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      status: "shipped",
      tracking_number: "",
    },
  });

  useEffect(() => {
    if (selectedOrder) {
      reset({
        status: selectedOrder.status === "paid" ? "shipped" : selectedOrder.status,
        tracking_number: selectedOrder.tracking_number || "",
      });
    }
  }, [selectedOrder, reset]);

  const newStatus = watch("status");
  const formTracking = watch("tracking_number");
  const effectiveTracking = formTracking || selectedOrder?.tracking_number;

  if (!selectedOrder) return null;

  const isPending = selectedOrder.status === "pending";
  const items = Array.isArray(selectedOrder.order_items) ? selectedOrder.order_items : [];
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  const handleCopyShippingData = () => {
    const text = [
      `Destinatario: ${selectedOrder.customer_name || ""}`,
      `Teléfono: ${selectedOrder.customer_phone || "No especificado"}`,
      `Email: ${selectedOrder.customer_email || ""}`,
      `Dirección: ${selectedOrder.shipping_address || ""}`,
      `Localidad: ${selectedOrder.shipping_city || ""}`,
      `Provincia: ${selectedOrder.shipping_province || ""}`,
      `Código Postal: ${selectedOrder.shipping_postal_code || ""}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {isPending ? "Detalle de Pedido" : "Actualizar Pedido"} {selectedOrder.order_number}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  selectedOrder.status === "paid"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : selectedOrder.status === "shipped"
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                      : selectedOrder.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : selectedOrder.status === "delivered"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {selectedOrder.status}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Fecha de compra: {formatDate(selectedOrder.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {isPending && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 leading-relaxed">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold block">Orden Pendiente de Pago</span>
                Las órdenes pendientes no pueden modificarse manualmente. Se actualizarán automáticamente a &ldquo;Pagado&rdquo; una vez que Mercado Pago acredite la transacción.
              </div>
            </div>
          )}

          {/* Grid: Cliente y Despacho Andreani */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta de Destinatario y Dirección Andreani */}
            <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Destinatario & Envío</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShippingData}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-amber-600 text-[10px] font-semibold transition-colors cursor-pointer"
                  title="Copiar datos para rotular o pegar en Andreani"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar para rotulado</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  {selectedOrder.customer_name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>{selectedOrder.customer_email}</span>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-start gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedOrder.shipping_address}</p>
                    <p className="text-[11px] text-zinc-500">
                      {selectedOrder.shipping_city}, {selectedOrder.shipping_province}
                    </p>
                    <span className="inline-block mt-1 font-mono font-bold text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20">
                      CP: {selectedOrder.shipping_postal_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicaciones de entrega del cliente */}
              {selectedOrder.notes && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
                  <span className="font-semibold text-[11px] text-zinc-700 dark:text-zinc-300 block mb-1">
                    Indicaciones de Entrega del Cliente
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-[11px] text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                    &ldquo;{selectedOrder.notes}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Tarjeta de Gestión Logística Andreani */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Logística Andreani Oficial</span>
                  </div>
                  {effectiveTracking && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                      Guía Generada
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Registra el paquete en Andreani PyME, genera la etiqueta oficial con el CP y notifica por email al comprador automáticamente.
                </p>

                {effectiveTracking ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                        Código de Seguimiento
                      </span>
                      <span className="font-mono font-bold text-sm">
                        {effectiveTracking}
                      </span>
                    </div>

                    <a
                      href={
                        effectiveTracking.startsWith("#")
                          ? "https://pymes.andreani.com/ver-envios?tab=integraciones"
                          : `https://www.andreani.com/#!/informacionEnvio/${encodeURIComponent(effectiveTracking)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-700 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {effectiveTracking.startsWith("#")
                          ? "Gestionar en Andreani PyME"
                          : "Ver en Andreani"}
                      </span>
                    </a>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onGenerateAndreaniShipment}
                      disabled={isPending || isGeneratingAndreani || isUpdating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </div>
                )}
              </div>

              {/* Costo de Envío Andreani abonado */}
              <div className="pt-3 border-t border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Tarifa de envío:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedOrder.shipping_cost > 0
                    ? formatCurrency(selectedOrder.shipping_cost)
                    : "Gratis (Bonificado)"}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Productos a Embalar / Despachar */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Productos a Embalar ({items.length} {items.length === 1 ? "ítem" : "ítems"} · {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">Verificá los ítems para el despacho</span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 italic">
                No se registraron líneas de productos para este pedido.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Producto / Variante</th>
                      <th className="py-2.5 px-3 font-bold">SKU</th>
                      <th className="py-2.5 px-3 font-bold text-center">Cant.</th>
                      <th className="py-2.5 px-3 font-bold text-right">Precio Unit.</th>
                      <th className="py-2.5 px-4 font-bold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">
                            {it.product_name}
                          </p>
                          {it.variant_name && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Variante: {it.variant_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                            {it.sku || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/20">
                            {it.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-400">
                          {formatCurrency(it.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(it.subtotal || it.unit_price * it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Desglose Económico */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span>Resumen Financiero del Pedido</span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Subtotal de productos:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatCurrency(selectedOrder.subtotal)}
                </span>
              </div>

              {(Number(selectedOrder.discount_amount) > 0 || selectedOrder.coupon_code) && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Cupón aplicado {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ""}:
                  </span>
                  <span>- {formatCurrency(selectedOrder.discount_amount || 0)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Costo de envío (Andreani):</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {selectedOrder.shipping_cost > 0
                    ? formatCurrency(selectedOrder.shipping_cost)
                    : "Gratis"}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                <span>Total Abonado:</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-base">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Estado Operativo y Tracking Manual */}
          <form id="order-status-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Estado del Pedido
                </label>
                <select
                  disabled={isPending}
                  {...register("status")}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending && <option value="pending">Pendiente de acreditación</option>}
                  <option value="paid">Pagado (Listo para embalar / despachar)</option>
                  <option value="shipped">Enviado (En camino)</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {newStatus === "shipped" && !isPending && (
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Código de Seguimiento (Tracking)
                  </label>
                  <input
                    type="text"
                    {...register("tracking_number")}
                    placeholder="Ej: ANDR_00123982 o #123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isPending ? "Cerrar" : "Cancelar"}
          </button>

          {!isPending && (
            <button
              type="submit"
              form="order-status-form"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
