"use client";

import { useState } from "react";
import { Ticket, XCircle, Plus, Minus, AlertCircle, Loader2 } from "lucide-react";

export default function CouponCreateModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePercentDecrement = () => {
    setDiscountPercent((prev) => Math.max(1, prev - 1));
  };

  const handlePercentIncrement = () => {
    setDiscountPercent((prev) => Math.min(100, prev + 1));
  };

  const handlePercentChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setDiscountPercent(1);
    } else {
      setDiscountPercent(Math.min(100, Math.max(1, num)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("El código de cupón es obligatorio.");
      return;
    }

    if (discountPercent < 1 || discountPercent > 100) {
      setError("El porcentaje debe estar entre 1% y 100%.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        code: cleanCode,
        discount_percent: discountPercent,
        is_active: true,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      // Reset form upon successful submit
      setCode("");
      setDiscountPercent(10);
      setMaxUses("");
      setExpiresAt("");
      setError("");
    } catch (err) {
      setError(err.message || "Error al crear el cupón.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#de1b76]" />
            <span>Crear Nuevo Cupón</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Código de Cupón *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EJ: VERANO20"
              required
              className="w-full px-3.5 py-2 font-mono uppercase tracking-wider text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Se convertirá automáticamente a mayúsculas sin espacios.
            </p>
          </div>

          {/* Porcentaje con Stepper */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Porcentaje de Descuento *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePercentDecrement}
                disabled={discountPercent <= 1}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                title="Bajar 1%"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  required
                  className="w-full text-center py-2 px-3 text-base font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm pointer-events-none">
                  %
                </span>
              </div>

              <button
                type="button"
                onClick={handlePercentIncrement}
                disabled={discountPercent >= 100}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                title="Subir 1%"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>Mínimo: 1%</span>
              <span>Máximo: 100%</span>
            </div>
          </div>

          {/* Límite de usos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Límite de Usos Totales (Opcional)
            </label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Dejar vacío para ilimitado"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
            />
          </div>

          {/* Fecha de Expiración */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Fecha de Vencimiento (Opcional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#de1b76] hover:bg-[#c21464] text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Crear Cupón</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
