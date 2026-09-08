"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrderStatus() {
      if (!orderNumber) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/api/orders/${orderNumber}/status`);
        setOrder(data);
      } catch (e) {
        console.error("Error loading order status:", e);
      } finally {
        setLoading(false);
      }
    }
    loadOrderStatus();
  }, [orderNumber]);

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const steps = [
    { key: "pending", label: "Pedido Realizado", icon: Clock },
    { key: "paid", label: "Pago Confirmado", icon: CheckCircle2 },
    { key: "shipped", label: "En Despacho", icon: Truck },
    { key: "delivered", label: "Entregado", icon: Package },
  ];

  const statusIndexMap = {
    pending: 0,
    payment_pending: 0,
    paid: 1,
    shipped: 2,
    delivered: 3,
    cancelled: -1,
  };

  const currentStepIndex = order ? (statusIndexMap[order.status] ?? 0) : 0;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-10 w-48 rounded-xl mb-4" />
        <Skeleton className="h-32 w-full rounded-3xl mb-6" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Pedido no encontrado</h2>
        <p className="text-slate-500 text-sm mt-2">
          No encontramos ningún pedido con el número #{orderNumber}.
        </p>
        <Link href="/productos" className="mt-6 inline-block">
          <Button variant="primary">Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-6">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Estado del Pedido
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              #{order.order_number}
            </h1>
          </div>
          <div className="text-right sm:self-auto self-start">
            <span className="text-xs text-slate-400 block">Total de la orden</span>
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="pt-8 pb-4">
          <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 leading-tight ${
                      isCurrent
                        ? "text-rose-600"
                        : isCompleted
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Summary details */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Detalles</h3>
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Cliente</span>
            <span className="font-bold text-slate-900">{order.customer_name}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Costo de envío</span>
            <span className="font-bold text-slate-900">
              {formatPrice(order.shipping_cost)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estado de pago</span>
            <span className="font-bold text-emerald-600 capitalize">
              {order.payment_status || "Aprobado"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
