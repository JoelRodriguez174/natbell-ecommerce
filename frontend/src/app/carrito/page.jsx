"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import ShippingCalculator from "@/components/cart/ShippingCalculator";
import CartItemRow from "@/components/cart/CartItemRow";
import CartOrderSummary from "@/components/cart/CartOrderSummary";
import { useCartStore } from "@/store/useCartStore";
import { useShippingStore } from "@/store/useShippingStore";

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getSubtotal,
  } = useCartStore();

  const { quote } = useShippingStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalItemsCount = getTotalItems();
  const subtotalAmount = getSubtotal();
  const shippingCost = quote?.cost ? Number(quote.cost) : 0;
  const grandTotal = subtotalAmount + shippingCost;
  const cuotaTotal = Math.round(grandTotal / 3);

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Carrito de Compras" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-3">
              <span>Carrito de Compras</span>
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full bg-[#DE1B76] text-white">
                {totalItemsCount} {totalItemsCount === 1 ? "ítem" : "ítems"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Revisá tus productos, cotizá tu costo de envío y completá tu pedido.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                data-testid="clear-cart-page-btn"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar Carrito</span>
              </button>
            </div>
          )}
        </div>

        {/* Estado Vacío */}
        {items.length === 0 ? (
          <div
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs"
            data-testid="cart-page-empty"
          >
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-[#DE1B76] mx-auto border border-rose-100">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                Tu carrito actualmente no tiene productos
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Navegá por nuestro catálogo y descubrí las mejores ofertas en cosmética capilar, tratamientos y artículos de peluquería profesional.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/productos")}
              className="bg-[#DE1B76] hover:bg-[#c21464] text-white px-8 font-bold rounded-xl shadow-md hover:shadow-[#DE1B76]/25"
            >
              Explorar Catálogo
            </Button>
          </div>
        ) : (
          /* Grid de Carrito con Productos */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Lista de Productos */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
                {items.map((item) => (
                  <CartItemRow
                    key={item.itemKey}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                  />
                ))}
              </div>

              {/* Botón Seguir Comprando */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#DE1B76] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Seguir agregando productos</span>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Cotizador de Envíos y Resumen de Pedido */}
            <div className="lg:col-span-4 space-y-6">
              {/* Cotizador de Envíos */}
              <ShippingCalculator />

              {/* Tarjeta de Resumen de Compra */}
              <CartOrderSummary
                totalItemsCount={totalItemsCount}
                subtotalAmount={subtotalAmount}
                quote={quote}
                grandTotal={grandTotal}
                cuotaTotal={cuotaTotal}
                onProceedToCheckout={() => router.push("/checkout")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
