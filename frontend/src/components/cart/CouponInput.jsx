"use client";

import { useState } from "react";
import { Tag, CheckCircle2, X, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { apiFetch } from "@/lib/api";

export default function CouponInput({ className = "" }) {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApply = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setErrorMsg("");
    setIsLoading(true);

    try {
      const data = await apiFetch("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: cleanCode }),
      });

      if (data && data.valid) {
        applyCoupon({
          code: data.code,
          discount_percent: data.discount_percent,
        });
        setCode("");
        setErrorMsg("");
      } else {
        setErrorMsg("El cupón ingresado no es válido.");
      }
    } catch (err) {
      setErrorMsg(err.message || "No se pudo validar el cupón.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setErrorMsg("");
  };

  if (appliedCoupon) {
    return (
      <div
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 transition-all ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 truncate">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800">
                {appliedCoupon.code}
              </span>
              <span className="text-emerald-700 font-bold">
                -{appliedCoupon.discount_percent}% OFF
              </span>
            </p>
            <p className="text-[11px] text-emerald-600 truncate">
              Descuento aplicado sobre el subtotal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 px-2 py-1 rounded-lg border border-gray-200 hover:border-red-200 transition-colors shrink-0"
          title="Quitar cupón"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quitar</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
            <Tag className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (errorMsg) setErrorMsg("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply(e);
              }
            }}
            placeholder="CÓDIGO DE CUPÓN"
            disabled={isLoading}
            className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono tracking-wider uppercase rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20 bg-white placeholder:text-gray-400 transition-colors disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading || !code.trim()}
          className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gray-900 hover:bg-[#de1b76] text-white disabled:opacity-40 disabled:hover:bg-gray-900 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Aplicando</span>
            </>
          ) : (
            <span>Aplicar</span>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-[11px] sm:text-xs text-red-600 font-medium pl-1 flex items-center gap-1 animate-fadeIn">
          <span>⚠️</span> {errorMsg}
        </p>
      )}
    </div>
  );
}
