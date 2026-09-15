"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
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

  const totalItemsCount = getTotalItems();
  const subtotalAmount = getSubtotal();

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
              {items.map((item) => (
                <div
                  key={item.itemKey}
                  className="pt-3 first:pt-0 flex gap-3 group"
                  data-testid={`cart-item-${item.itemKey}`}
                >
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
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
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

                    <div className="flex items-center justify-between mt-2 pt-1">
                      {/* Selector de cantidad */}
                      <div className="flex items-center border border-gray-200 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Disminuir cantidad"
                          data-testid={`qty-decrease-${item.itemKey}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-gray-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.maxStock != null && item.quantity >= item.maxStock}
                          onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          aria-label="Aumentar cantidad"
                          data-testid={`qty-increase-${item.itemKey}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Precio y Eliminar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-950">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemKey)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          title="Eliminar producto"
                          aria-label="Eliminar producto"
                          data-testid={`remove-item-${item.itemKey}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
