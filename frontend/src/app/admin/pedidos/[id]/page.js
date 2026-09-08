"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/orders/${orderId}`, {
        headers: adminAuth.getAuthHeaders(),
      });
      setOrder(data);
      setSelectedStatus(data.status);
    } catch (e) {
      console.error("Error loading order:", e);
      addToast("Error al cargar orden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedStatus(newStatus);
      addToast(`Estado actualizado a "${newStatus}"`, "success");
      loadOrder();
    } catch (e) {
      addToast(e.message || "Error al actualizar estado", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando pedido...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-500">Pedido no encontrado</div>;
  }

  const items = order.items || order.order_items || [];
  const payment = order.payment || (order.payments && order.payments[0]) || null;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/pedidos"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a pedidos</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Detalle de Pedido
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            #{order.order_number}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fecha: {order.created_at ? new Date(order.created_at).toLocaleString("es-AR") : "-"}
          </p>
        </div>

        {/* Change status control */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold">Estado:</span>
          <select
            value={selectedStatus}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="pending">Pendiente</option>
            <option value="payment_pending">Pago Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="shipped">En Despacho</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* 2-column info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer info */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <User size={16} />
            <span>Datos del Cliente</span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-white font-bold text-sm">{order.customer_name}</p>
            <p className="text-slate-400">Email: {order.customer_email}</p>
            <p className="text-slate-400">Teléfono: {order.customer_phone}</p>
          </div>
        </div>

        {/* Shipping info */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Truck size={16} />
            <span>Dirección de Envío</span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-white font-bold text-sm">{order.shipping_address}</p>
            <p className="text-slate-400">
              {order.shipping_city}, {order.shipping_province} (CP: {order.shipping_postal_code})
            </p>
            {order.notes && (
              <p className="text-amber-400/90 italic pt-1">
                Nota: &quot;{order.notes}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order items table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Artículos del Pedido</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3">Variante / SKU</th>
                <th className="py-2.5 px-3">Precio Unit.</th>
                <th className="py-2.5 px-3">Cantidad</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((it) => (
                <tr key={it.id || it.sku}>
                  <td className="py-3 px-3 font-bold text-white">
                    {it.product_name}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {it.variant_name} ({it.sku})
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {formatPrice(it.unit_price)}
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {it.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-white">
                    {formatPrice(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-bold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Costo de Envío</span>
              <span className="text-white font-bold">{formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Total</span>
              <span className="text-rose-500">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
