"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ShoppingBag } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CheckoutFailurePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 animate-in zoom-in">
        <AlertCircle size={44} />
      </div>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        No se pudo completar el pago
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">
        MercadoPago no pudo procesar tu pago. Puede deberse a fondos insuficientes, datos incorrectos de la tarjeta o un rechazo del emisor.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/checkout">
          <Button variant="primary" size="md">
            <RotateCcw size={16} />
            <span>Reintentar compra</span>
          </Button>
        </Link>
        <Link href="/carrito">
          <Button variant="outline" size="md">
            <ShoppingBag size={16} />
            <span>Volver al carrito</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
