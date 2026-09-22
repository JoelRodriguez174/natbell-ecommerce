"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import CartDrawerItem from "@/components/cart/CartDrawerItem";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";

/**
 * Drawer lateral del carrito de compras.
 * Modularizado y atomizado con CartDrawerItem.
 */
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
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
      aria-labelledby="cart-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop oscuro translúcido */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-50 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-rose-100 animate-in slide-in-from-right duration-250">
          {/* Header del Carrito */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/40 text-zinc-900 flex items-center justify-between border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100/70 flex items-center justify-center text-[#DE1B76]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 id="cart-title" className="font-bold text-sm sm:text-base text-zinc-900">Mi Carrito</h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-[#DE1B76] border border-rose-200">
                {totalItemsCount} {totalItemsCount === 1 ? "ítem" : "ítems"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-medium text-zinc-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-1"
                  title="Vaciar carrito"
                  data-testid="clear-cart-btn"
                >
                  Vaciar
                </button>
              )}
              <button
                type="button"
                onClick={closeCart}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
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
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#DE1B76] mb-4 shadow-2xs">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">
                Tu carrito está vacío
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">
                Explorá nuestro catálogo con las mejores marcas profesionales de peluquería y cosmética capilar.
              </p>
              <Link
                href="/productos"
                onClick={closeCart}
                className="inline-flex items-center justify-center bg-[#DE1B76] hover:bg-[#c21464] text-white text-xs px-6 py-3 font-bold rounded-xl shadow-md shadow-[#DE1B76]/25 transition-all active:scale-95 cursor-pointer"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <>
              <div
                className="flex-1 overflow-y-auto divide-y divide-gray-100 p-4 space-y-3"
                data-testid="cart-items-list"
              >
                {items.map((item) => (
                  <CartDrawerItem
                    key={item.itemKey}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onCloseCart={closeCart}
                  />
                ))}
              </div>

              {/* Footer con Subtotal y Botones CTA */}
              <div className="p-4 sm:p-5 border-t border-rose-100 bg-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-gray-600">Subtotal</span>
                  <span className="font-black text-base sm:text-lg text-[#DE1B76]">
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
                    className="w-full h-11 bg-[#DE1B76] hover:bg-[#c21464] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#DE1B76]/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    data-testid="go-to-cart-page-btn"
                  >
                    <span>Ver Carrito y Cotizar Envío</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={closeCart}
                    className="w-full py-2 text-center text-xs font-semibold text-zinc-500 hover:text-[#DE1B76] transition-colors cursor-pointer"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
