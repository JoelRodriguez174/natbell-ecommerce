"use client";

import React from "react";
import Link from "next/link";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartItem from "./CartItem";
import Button from "../ui/Button";

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    subtotal,
    totalItems,
  } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tu Carrito</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <ShoppingBag size={32} />
                </div>
                <p className="font-semibold text-slate-700 text-sm">
                  Tu carrito está vacío
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Explorá nuestro catálogo con más de 650 productos profesionales.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={closeDrawer}
                >
                  <Link href="/productos">Ver productos</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <CartItem
                  key={item.variant_id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-600">Subtotal</span>
                <span className="text-xl font-black text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                El costo de envío se calculará en el checkout según tu código postal.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link href="/checkout" onClick={closeDrawer} className="w-full">
                  <Button variant="primary" size="lg" className="w-full group">
                    <span>Iniciar Compra</span>
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Button>
                </Link>
                <Link
                  href="/carrito"
                  onClick={closeDrawer}
                  className="text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
                >
                  Ver carrito completo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
