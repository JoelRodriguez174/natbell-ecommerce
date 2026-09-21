import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Check, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * Fila atómica de producto dentro del carrito lateral (CartDrawer).
 * Maneja el estado local de cambio de cantidad pendiente y confirmación interactiva.
 */
export default function CartDrawerItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onCloseCart,
}) {
  const [pendingQty, setPendingQty] = useState(undefined);

  const hasPending = pendingQty !== undefined && pendingQty !== item.quantity;
  const displayQty = hasPending ? pendingQty : item.quantity;
  const unitPrice = item.price ?? item.unitPrice ?? 0;

  const handleStepQty = (delta) => {
    const current = pendingQty !== undefined ? pendingQty : item.quantity;
    const next = current + delta;
    const limit = item.maxStock != null ? item.maxStock : 99;
    if (next < 1 || next > limit) return;

    if (next === item.quantity) {
      setPendingQty(undefined);
    } else {
      setPendingQty(next);
    }
  };

  const handleInputChange = (val) => {
    if (val === "") {
      setPendingQty("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const limit = item.maxStock != null ? item.maxStock : 99;
    const clamped = Math.max(1, Math.min(parsed, limit));
    if (clamped === item.quantity) {
      setPendingQty(undefined);
    } else {
      setPendingQty(clamped);
    }
  };

  const handleInputBlur = () => {
    if (pendingQty === "" || pendingQty === undefined || isNaN(pendingQty) || pendingQty < 1) {
      setPendingQty(undefined);
    }
  };

  const handleConfirmQty = () => {
    if (pendingQty !== undefined) {
      onUpdateQuantity(item.itemKey, pendingQty);
      setPendingQty(undefined);
    }
  };

  const handleCancelQty = () => {
    setPendingQty(undefined);
  };

  return (
    <div
      className="pt-3 pb-2 first:pt-0 flex gap-3 group relative border-b border-gray-100 last:border-0"
      data-testid={`cart-item-${item.itemKey}`}
    >
      {/* Botón X para eliminar */}
      <button
        type="button"
        onClick={() => {
          handleCancelQty();
          onRemoveItem(item.itemKey);
        }}
        className="absolute top-1 right-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors cursor-pointer"
        title="Eliminar producto"
        aria-label="Eliminar producto"
        data-testid={`remove-item-${item.itemKey}`}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Imagen Thumbnail */}
      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={72}
            height={72}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Info y Controles */}
      <div className="flex-1 min-w-0 flex flex-col justify-between pr-7">
        <div>
          {item.brandName && (
            <span className="text-[10px] font-bold text-[#5EB82D] uppercase tracking-wider block truncate">
              {item.brandName}
            </span>
          )}
          <Link
            href={`/productos/${item.slug}`}
            onClick={onCloseCart}
            className="text-xs font-semibold text-gray-900 hover:text-[#DE1B76] line-clamp-2 leading-snug transition-colors"
          >
            {item.name}
          </Link>
          {item.variantName && (
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md bg-rose-50/80 border border-rose-100/60 text-zinc-700 text-[10px] font-medium">
              {item.variantName}
            </span>
          )}
        </div>

        <div className="mt-2 pt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            {/* Selector de cantidad */}
            <div
              className={`flex items-center border rounded-lg bg-white transition-colors ${
                hasPending
                  ? "border-amber-400 ring-1 ring-amber-300"
                  : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handleStepQty(-1)}
                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Disminuir cantidad"
                data-testid={`qty-decrease-${item.itemKey}`}
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="1"
                max={item.maxStock || 99}
                value={displayQty}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                className={`w-8 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent border-0 focus:outline-none rounded ${
                  hasPending
                    ? "text-[#DE1B76] font-extrabold"
                    : "text-gray-900 font-bold"
                }`}
                aria-label={`Cantidad para ${item.name}`}
                data-testid={`qty-input-${item.itemKey}`}
              />
              <button
                type="button"
                disabled={item.maxStock != null && displayQty >= item.maxStock}
                onClick={() => handleStepQty(1)}
                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Aumentar cantidad"
                data-testid={`qty-increase-${item.itemKey}`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Precio Subtotal del ítem */}
            <div className="flex items-center">
              <span className="text-xs font-black text-gray-950">
                {formatCurrency(unitPrice * item.quantity)}
              </span>
            </div>
          </div>

          {/* Confirmación explícita de cambio de stock */}
          {hasPending && (
            <div className="flex items-center justify-between bg-rose-50/70 border border-rose-200 rounded-lg p-1.5 text-xs animate-in fade-in duration-150">
              <span className="text-[11px] font-medium text-rose-900">
                Cambiar a <strong>{displayQty}</strong> un.?
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleConfirmQty}
                  className="bg-[#5EB82D] hover:bg-[#4e9c24] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                  title="Confirmar cantidad"
                  data-testid={`qty-confirm-${item.itemKey}`}
                >
                  <Check className="w-3 h-3" />
                  <span>Confirmar</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelQty}
                  className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Cancelar cambio"
                  data-testid={`qty-cancel-${item.itemKey}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
