import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ArrowRight, Loader2, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice, productImageSrc } from "../../lib/utils";

export default function OrderSummary({
  items = [],
  subtotal = 0,
  shippingCost = 0,
  isFreeShipping = false,
  total = 0,
  isLoading = false,
  onSubmit = () => {},
}) {
  const { appliedCoupon, getDiscountAmount, removeCoupon } = useCartStore();
  const discountAmount = appliedCoupon ? getDiscountAmount() : 0;
  const effectiveTotal = Math.max(0, total - discountAmount);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm sticky top-24">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        Resumen de la Compra
      </h3>

      {/* Lista de productos en la orden */}
      <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 pr-1 mb-4 space-y-3">
        {items.map((item) => (
          <OrderSummaryItem key={item.itemKey} item={item} />
        ))}
      </div>

      {/* Desglose de totales */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Subtotal productos</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatPrice(subtotal)}
          </span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span>
                Descuento cupón {appliedCoupon.code ? `(${appliedCoupon.code} - ${appliedCoupon.discount_percent}%)` : `(${appliedCoupon.discount_percent}%)`}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                title="Quitar cupón"
              >
                <X className="w-3 h-3" />
                <span>Quitar</span>
              </button>
            </span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Costo de envío</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {isFreeShipping ? (
              <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-xs">
                ¡Bonificado (Gratis)!
              </span>
            ) : shippingCost > 0 ? (
              formatPrice(shippingCost)
            ) : (
              "Gratis o a calcular"
            )}
          </span>
        </div>

        <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-50 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <span>Total final</span>
          <span className="text-base font-black text-[#DE1B76]">
            {formatPrice(effectiveTotal)}
          </span>
        </div>
      </div>

      {/* Botón de Pago Directo */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || items.length === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-sky-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Conectando con Mercado Pago...</span>
            </>
          ) : (
            <>
              <span>Pagar con Mercado Pago</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Badge de seguridad */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Pagos encriptados y procesados de forma segura por Mercado Pago.</span>
      </div>
    </div>
  );
}

function OrderSummaryItem({ item }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3 pt-3 first:pt-0">
      <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden relative">
        {!imageError && item.image ? (
          <Image
            src={productImageSrc(item.image)}
            alt={item.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-xs font-semibold text-zinc-400">
            {item.name?.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {item.name}
        </h4>
        {item.variantName && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.variantName}
          </p>
        )}
        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-semibold mt-0.5">
          {item.quantity} x {formatPrice(item.price)}
        </p>
      </div>

      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
        {formatPrice(item.price * item.quantity)}
      </span>
    </div>
  );
}
