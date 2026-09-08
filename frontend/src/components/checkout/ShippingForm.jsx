"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Building, Truck } from "lucide-react";
import Input from "../ui/Input";
import { apiFetch } from "@/lib/api";

export default function ShippingForm({
  data,
  onChange,
  onShippingQuoteChange,
  errors = {},
}) {
  const [shippingQuote, setShippingQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  // Auto quote shipping whenever postal code has at least 4 digits
  useEffect(() => {
    const cp = data.shipping_postal_code?.trim();
    if (!cp || cp.length < 3) {
      setShippingQuote(null);
      onShippingQuoteChange(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const quote = await apiFetch(`/api/shipping/quote?postal_code=${encodeURIComponent(cp)}`);
        setShippingQuote(quote);
        onShippingQuoteChange(quote);
      } catch (e) {
        console.error("Shipping quote error:", e);
      } finally {
        setQuoting(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [data.shipping_postal_code]);

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
          2
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Dirección de Envío</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Calle y Número (y Piso/Depto)"
            placeholder="Ej: Av. Corrientes 1234, Piso 4 B"
            icon={MapPin}
            required
            value={data.shipping_address}
            onChange={(e) => onChange("shipping_address", e.target.value)}
            error={errors.shipping_address}
          />
        </div>

        <div>
          <Input
            label="Ciudad / Localidad"
            placeholder="Ej: San Isidro / CABA"
            icon={Building}
            required
            value={data.shipping_city}
            onChange={(e) => onChange("shipping_city", e.target.value)}
            error={errors.shipping_city}
          />
        </div>

        <div>
          <Input
            label="Provincia"
            placeholder="Ej: Buenos Aires"
            required
            value={data.shipping_province}
            onChange={(e) => onChange("shipping_province", e.target.value)}
            error={errors.shipping_province}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Código Postal (Argentina)"
            placeholder="Ej: 1425, C1425DKB, 1640, 5000"
            required
            value={data.shipping_postal_code}
            onChange={(e) => onChange("shipping_postal_code", e.target.value)}
            error={errors.shipping_postal_code}
          />
          {quoting && (
            <p className="text-xs text-slate-400 mt-1 animate-pulse">
              Calculando zona de envío...
            </p>
          )}

          {shippingQuote && !quoting && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Truck size={16} />
                </div>
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Envío a Zona {shippingQuote.zone_name}
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    Llega en {shippingQuote.estimated_days} días hábiles
                  </span>
                </div>
              </div>
              <span className="font-black text-emerald-900 text-sm">
                {formatPrice(shippingQuote.cost)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
