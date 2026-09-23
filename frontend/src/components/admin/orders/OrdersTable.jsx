"use client";

import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Edit,
  Eye,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";

export default function OrdersTable({ orders, isLoading, onManageOrder }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 font-bold">Orden / Fecha</th>
              <th className="py-3.5 px-4 font-bold">Cliente</th>
              <th className="py-3.5 px-4 font-bold">Dirección de Envío</th>
              <th className="py-3.5 px-4 font-bold">Monto Total</th>
              <th className="py-3.5 px-4 font-bold">Estado</th>
              <th className="py-3.5 px-4 font-bold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  <span>Cargando pedidos...</span>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  No se encontraron pedidos con el criterio seleccionado.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr
                  key={ord.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">
                      {ord.order_number}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatDate(ord.created_at)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {ord.customer_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" />
                        {ord.customer_email}
                      </span>
                      {ord.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {ord.customer_phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{ord.shipping_address}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {ord.shipping_city}, {ord.shipping_province} (CP{" "}
                      {ord.shipping_postal_code})
                    </p>
                    {ord.notes && (
                      <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40 italic">
                        <span className="font-bold not-italic text-amber-900 dark:text-amber-200">
                          Nota:
                        </span>{" "}
                        &ldquo;{ord.notes}&rdquo;
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                      {formatCurrency(ord.total)}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Envío: {formatCurrency(ord.shipping_cost || 0)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : ord.status === "shipped"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            : ord.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : ord.status === "delivered"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {ord.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                      {ord.status === "shipped" && <Truck className="w-3 h-3" />}
                      {ord.status === "pending" && <Clock className="w-3 h-3" />}
                      {ord.status === "delivered" && <Package className="w-3 h-3" />}
                      {ord.status === "cancelled" && <XCircle className="w-3 h-3" />}
                      <span>{ord.status}</span>
                    </span>
                    {ord.tracking_number && (
                      <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">
                        TRK: {ord.tracking_number}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onManageOrder(ord)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        ord.status === "pending"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                          : "bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {ord.status === "pending" ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Ver detalle</span>
                        </>
                      ) : (
                        <>
                          <Edit className="w-3 h-3" />
                          <span>Gestionar</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
