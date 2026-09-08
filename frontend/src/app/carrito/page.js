"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Button from "@/components/ui/Button";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalItems } =
    useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/productos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Seguir comprando</span>
          </Link>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 font-medium"
          >
            <Trash2 size={14} />
            <span>Vaciar carrito</span>
          </button>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8">
        Tu Carrito de Compras ({totalItems})
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tu carrito está vacío
          </h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
            Aún no has agregado ningún producto. Descubrí nuestra amplia gama de productos profesionales.
          </p>
          <div className="mt-8">
            <Link href="/productos">
              <Button variant="primary" size="lg">
                Ver catálogo de productos
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items list */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs divide-y divide-slate-100">
            {items.map((item) => (
              <CartItem
                key={item.variant_id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:col-span-4 sticky top-24">
            <CartSummary subtotal={subtotal} showCheckoutButton={true} />
          </div>
        </div>
      )}
    </div>
  );
}
