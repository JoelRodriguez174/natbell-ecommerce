"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getSubtotal,
  } = useCartStore();

  const [pendingQty, setPendingQty] = useState({});

  const totalItemsCount = getTotalItems();
  const subtotalAmount = getSubtotal();

  const handleStepQty = (itemKey, delta, actualQty, maxStock) => {
    const current = pendingQty[itemKey] !== undefined ? pendingQty[itemKey] : actualQty;
    const next = current + delta;
    const limit = maxStock != null ? maxStock : 99;
    if (next < 1 || next > limit) return;

    if (next === actualQty) {
      setPendingQty((prev) => {
        const nextState = { ...prev };
        delete nextState[itemKey];
        return nextState;
      });
    } else {
      setPendingQty((prev) => ({ ...prev, [itemKey]: next }));
    }
  };

  const handleConfirmQty = (itemKey) => {
    const targetQty = pendingQty[itemKey];
    if (targetQty !== undefined) {
      updateQuantity(itemKey, targetQty);
      setPendingQty((prev) => {
        const nextState = { ...prev };
        delete nextState[itemKey];
        return nextState;
      });
    }
  };

  const handleCancelQty = (itemKey) => {
    setPendingQty((prev) => {
      const nextState = { ...prev };
      delete nextState[itemKey];
      return nextState;
    });
  };

  // Cerrar drawer al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Prevenir scroll en body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
      data-testid="cart-drawer"
    >
      {/* Backdrop con fade */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        data-testid="cart-backdrop"
      />

      {/* Panel lateral deslizante */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-300" />
            <h3 className="font-bold text-sm sm:text-base">Mi Carrito</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
              {totalItemsCount} {totalItemsCount === 1 ? "ítem" : "ítems"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer px-2 py-1"
                title="Vaciar carrito"
                data-testid="clear-cart-btn"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
              data-testid="close-cart-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido / Lista de productos */}
        {items.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            data-testid="cart-empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">
              Tu carrito está vacío
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">
              Explorá nuestro catálogo con las mejores marcas profesionales de peluquería y cosmética capilar.
            </p>
            <Button
              variant="primary"
              onClick={closeCart}
              className="bg-zinc-900 hover:bg-black text-white text-xs px-5 py-2.5 font-semibold rounded-xl"
            >
              <Link href="/productos">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto divide-y divide-gray-100 p-4 space-y-3"
              data-testid="cart-items-list"
            >
              {items.map((item) => {
                const hasPending =
                  pendingQty[item.itemKey] !== undefined &&
                  pendingQty[item.itemKey] !== item.quantity;
                const displayQty = hasPending ? pendingQty[item.itemKey] : item.quantity;

                return (
                  <div
                    key={item.itemKey}
                    className="pt-3 pb-2 first:pt-0 flex gap-3 group relative border-b border-gray-100 last:border-0"
                    data-testid={`cart-item-${item.itemKey}`}
                  >
                    {/* Botón X en esquina superior derecha para eliminar */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelQty(item.itemKey);
                        removeItem(item.itemKey);
                      }}
                      className="absolute top-1 right-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors cursor-pointer"
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                      data-testid={`remove-item-${item.itemKey}`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Imagen Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 ${item.image ? "hidden" : ""}`}>
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Info y Controles */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between pr-7">
                      <div>
                        {item.brandName && (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                            {item.brandName}
                          </span>
                        )}
                        <Link
                          href={`/productos/${item.slug}`}
                          onClick={closeCart}
                          className="text-xs font-semibold text-gray-900 hover:text-black line-clamp-2 leading-snug transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium">
                            {item.variantName}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-1 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          {/* Selector de cantidad */}
                          <div
                            className={`flex items-center border rounded-md bg-white transition-colors ${
                              hasPending
                                ? "border-amber-400 ring-1 ring-amber-300"
                                : "border-gray-200"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleStepQty(item.itemKey, -1, item.quantity, item.maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                              aria-label="Disminuir cantidad"
                              data-testid={`qty-decrease-${item.itemKey}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`w-7 text-center text-xs select-none ${
                                hasPending
                                  ? "text-amber-600 font-extrabold"
                                  : "text-gray-900 font-bold"
                              }`}
                            >
                              {displayQty}
                            </span>
                            <button
                              type="button"
                              disabled={item.maxStock != null && displayQty >= item.maxStock}
                              onClick={() => handleStepQty(item.itemKey, 1, item.quantity, item.maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label="Aumentar cantidad"
                              data-testid={`qty-increase-${item.itemKey}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Precio del ítem */}
                          <div className="flex items-center">
                            <span className="text-xs font-black text-gray-950">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Confirmación explícita de cambio de stock */}
                        {hasPending && (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-xs animate-in fade-in duration-150">
                            <span className="text-[11px] font-medium text-amber-800">
                              Cambiar a <strong>{displayQty}</strong> un.?
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmQty(item.itemKey)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                                title="Confirmar cantidad"
                                data-testid={`qty-confirm-${item.itemKey}`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Confirmar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelQty(item.itemKey)}
                                className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
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
              })}
            </div>

            {/* Footer con Subtotal y Botones CTA */}
            <div className="p-4 border-t border-gray-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-gray-600">Subtotal</span>
                <span className="font-black text-base sm:text-lg text-gray-950">
                  {formatCurrency(subtotalAmount)}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-tight">
                El costo de envío y medios de pago se calculan en el siguiente paso.
              </p>

              <div className="space-y-2 pt-1">
                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="w-full h-11 bg-zinc-950 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  data-testid="go-to-cart-page-btn"
                >
                  <span>Ver Carrito y Cotizar Envío</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full py-2 text-center text-xs font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
