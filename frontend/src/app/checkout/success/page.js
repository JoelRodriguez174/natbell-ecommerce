"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Package, Truck, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || searchParams.get("external_reference") || "ORD-2026";
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100 animate-in zoom-in">
        <CheckCircle2 size={44} />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
        ¡Pago Confirmado!
      </span>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1 mb-3">
        ¡Gracias por tu compra!
      </h1>

      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        Tu pedido ha sido recibido y está siendo preparado por el equipo de Los Arrayanes.
      </p>

      <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 text-left shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
          <span className="text-slate-500">Número de pedido</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{orderNumber}</span>
        </div>
        {paymentId && (
          <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500">ID de pago MercadoPago</span>
            <span className="font-mono text-slate-700">{paymentId}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs py-1">
          <span className="text-slate-500">Estado de preparación</span>
          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            En preparación para despacho
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={`/pedido/${orderNumber}`}>
          <Button variant="outline" size="md">
            <Package size={16} />
            <span>Consultar estado del pedido</span>
          </Button>
        </Link>
        <Link href="/productos">
          <Button variant="primary" size="md">
            <span>Seguir comprando</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando confirmación...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
