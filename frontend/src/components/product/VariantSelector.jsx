"use client";

import { Card, CardContent } from "@heroui/react";
import { Check, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";

export default function VariantSelector({
  variants = [],
  selectedVariant = null,
  onSelectVariant,
  basePrice = 0,
}) {
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Presentación / Tono / Medida
        </label>
        {selectedVariant && (
          <span className="text-xs text-[#DE1B76] font-bold">
            {selectedVariant.name}
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Variantes de producto"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
      >
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isOutOfStock = variant.stock <= 0;
          const price = variant.price_override ?? basePrice;

          return (
            <Card
              key={variant.id}
              onClick={() => !isOutOfStock && onSelectVariant && onSelectVariant(variant)}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isOutOfStock}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none",
                isSelected
                  ? "bg-rose-50/40 border-2 border-[#DE1B76] text-gray-950 shadow-xs ring-1 ring-[#DE1B76]/20"
                  : "bg-white border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50",
                isOutOfStock &&
                  "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 hover:border-gray-200 pointer-events-none"
              )}
            >
              <CardContent className="p-0 flex flex-col h-full justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs truncate pr-1">
                    {variant.name}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#DE1B76] flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                  <span className="font-bold text-gray-900">
                    {formatCurrency(price)}
                  </span>
                  <Badge
                    variant={
                      isOutOfStock
                        ? "outOfStock"
                        : variant.stock <= 5
                        ? "featured"
                        : "stock"
                    }
                    size="xs"
                  >
                    {isOutOfStock
                      ? "Sin stock"
                      : variant.stock <= 5
                      ? `¡Últimas ${variant.stock}!`
                      : "Stock"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedVariant && selectedVariant.stock <= 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Esta opción se encuentra agotada temporalmente.</span>
        </div>
      )}
    </div>
  );
}
