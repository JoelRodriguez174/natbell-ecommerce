"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import Button from "../ui/Button";

export default function CartSummary({
  subtotal,
  shippingCost = null,
  total = null,
  showCheckoutButton = true,
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const finalTotal = total !== null ? total : (shippingCost !== null ? subtotal + shippingCost : subtotal);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <h3 className="font-bold text-slate-900 text-lg">Resumen de Compra</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal productos</span>
          <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Envío</span>
          <span className="font-semibold text-slate-900">
            {shippingCost !== null ? formatPrice(shippingCost) : "A calcular en checkout"}
          </span>
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
          <span className="font-bold text-base text-slate-900">Total</span>
          <span className="font-black text-2xl text-rose-600">
            {formatPrice(finalTotal)}
          </span>
        </div>
      </div>

      {showCheckoutButton && (
        <Link href="/checkout" className="block w-full">
          <Button variant="primary" size="lg" className="w-full group">
            <span>Iniciar Compra</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      )}

      {/* Trust badges */}
      <div className="border-t border-slate-100 pt-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <Truck size={16} className="text-emerald-600 shrink-0" />
          <span>Envíos a todo el país (CABA, GBA e Interior)</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-rose-600 shrink-0" />
          <span>Pago 100% seguro con MercadoPago</span>
        </div>
      </div>
    </div>
  );
}
