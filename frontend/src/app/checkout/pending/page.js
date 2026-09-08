"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Package } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CheckoutPendingPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6 border border-amber-100 animate-in zoom-in">
        <Clock size={44} />
      </div>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        Pago en Proceso de Acreditación
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">
        Tu pago está pendiente de aprobación por la entidad emisora (Rapipago, Pago Fácil o transferencia bancaria). En cuanto se confirme, te avisaremos y comenzaremos el despacho.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/productos">
          <Button variant="primary" size="md">
            <span>Volver al catálogo</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
