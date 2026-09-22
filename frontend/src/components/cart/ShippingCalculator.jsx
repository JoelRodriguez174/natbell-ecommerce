"use client";

import { useState } from "react";
import { Truck, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getShippingQuote } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useShippingStore } from "@/store/useShippingStore";

export default function ShippingCalculator({ className = "", compact = false }) {
  const {
    postalCode,
    quote,
    isLoading,
    error,
    setPostalCode,
    setQuote,
    setError,
    setIsLoading,
    clearShipping,
  } = useShippingStore();

  const [localCP, setLocalCP] = useState(postalCode || "");

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();

    const cleanCP = localCP.trim().toUpperCase();
    if (!cleanCP) {
      setError("Por favor ingresá un código postal");
      return;
    }

    const numericMatch = cleanCP.match(/\d+/g);
    const digitsCount = numericMatch ? numericMatch.join("").length : 0;
    if (digitsCount > 4) {
      setError("El código postal argentino consta de 4 números (ej: 1414 o C1414CAB). No uses más de 4 dígitos.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getShippingQuote(cleanCP);
      setPostalCode(cleanCP);
      setQuote(data);
    } catch (err) {
      setError(err.message || "No se pudo calcular el envío para este código postal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    clearShipping();
    setLocalCP("");
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 transition-all ${className}`}
      data-testid="shipping-calculator"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Truck className="w-4 h-4 text-[#5EB82D] shrink-0" />
        <h4 className="text-xs sm:text-sm font-bold text-gray-900">
          Cotizador de Envíos
        </h4>
      </div>

      <p className="text-[11px] sm:text-xs text-gray-500 mb-3 leading-relaxed">
        Ingresá tu código postal para conocer el costo y tiempo estimado de entrega a tu domicilio.
      </p>

      {/* Formulario de consulta */}
      <form onSubmit={handleCalculate} className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Ej: 1414 o C1414CAB"
            value={localCP}
            onChange={(e) => setLocalCP(e.target.value)}
            disabled={isLoading}
            className="text-xs py-1.5 focus:border-[#DE1B76]"
            maxLength={10}
            data-testid="postal-code-input"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading || !localCP.trim()}
          className="bg-[#DE1B76] hover:bg-[#c21464] text-white shrink-0 text-xs px-3.5 py-2 font-bold rounded-lg shadow-sm hover:shadow-[#DE1B76]/20 transition-all"
          data-testid="calculate-shipping-btn"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Calcular"
          )}
        </Button>
      </form>

      {/* Mensaje de Error */}
      {error && (
        <div
          className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 mb-2"
          data-testid="shipping-error"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Resultado de Cotización */}
      {quote && !error && (
        <div
          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 animate-in fade-in duration-200"
          data-testid="shipping-result"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-gray-950">
                  {quote.zone_name}
                </span>
              </div>
              <p className="text-[11px] text-gray-600">
                {quote.description || `Llega en aprox. ${quote.estimated_days} días hábiles`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-gray-950 block">
                {formatCurrency(quote.cost)}
              </span>
              <span className="text-[10px] text-gray-400">Tarifa fija</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">
              CP: <strong>{quote.postal_code}</strong>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Cambiar CP</span>
            </button>
          </div>
        </div>
      )}

      {!quote && !error && (
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Ejemplos: 1414 (CABA), 1602 (GBA), 5000 (Córdoba)</span>
        </div>
      )}
    </div>
  );
}
