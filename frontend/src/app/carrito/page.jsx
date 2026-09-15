"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import ShippingCalculator from "@/components/cart/ShippingCalculator";
import { useCartStore } from "@/store/useCartStore";
import { useShippingStore } from "@/store/useShippingStore";
import { formatCurrency } from "@/lib/utils";

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
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full bg-zinc-900 text-white">
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
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
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
              className="bg-zinc-950 hover:bg-black text-white px-8 font-bold rounded-xl"
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
                  <div
                    key={item.itemKey}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-gray-50/50 transition-colors"
                    data-testid={`cart-page-item-${item.itemKey}`}
                  >
                    {/* Foto y Datos Principales */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        {item.brandName && (
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                            {item.brandName}
                          </span>
                        )}
                        <Link
                          href={`/productos/${item.slug}`}
                          className="text-sm font-bold text-gray-900 hover:text-black line-clamp-2 leading-snug transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-[11px] font-semibold">
                            Variante: {item.variantName}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 sm:hidden">
                          Unitario: <strong>{formatCurrency(item.price)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Controles de Cantidad y Totales */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {/* Selector de Cantidad */}
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          aria-label="Disminuir cantidad"
                          data-testid={`cart-page-qty-dec-${item.itemKey}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.maxStock != null && item.quantity >= item.maxStock}
                          onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
                          aria-label="Aumentar cantidad"
                          data-testid={`cart-page-qty-inc-${item.itemKey}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal Ítem */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-sm sm:text-base font-black text-gray-950 block">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <span className="text-[11px] text-gray-400 hidden sm:block">
                          {formatCurrency(item.price)} c/u
                        </span>
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.itemKey)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                        data-testid={`cart-page-remove-${item.itemKey}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón Seguir Comprando */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-black transition-colors"
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
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
                <h3 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100">
                  Resumen de la orden
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal productos ({totalItemsCount})</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(subtotalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>Costo de envío</span>
                    </span>
                    {quote ? (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(quote.cost)}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                        Calculá con tu CP arriba
                      </span>
                    )}
                  </div>

                  {quote && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center justify-between">
                      <span className="font-medium">{quote.zone_name}</span>
                      <span>Llega en ~{quote.estimated_days} días</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-950">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-950 block tracking-tight">
                        {formatCurrency(grandTotal)}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        O en 3 cuotas de {formatCurrency(cuotaTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Iniciar Compra (Preparado para Fase 6: Checkout) */}
                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Fase 6 redirigirá a /checkout
                      router.push("/checkout");
                    }}
                    className="w-full h-12 bg-zinc-950 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                    data-testid="proceed-to-checkout-btn"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Iniciar Compra Segura</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Transacción cifrada con MercadoPago</span>
                  </div>
                </div>
              </div>

              {/* Beneficios adicionales */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <CreditCard className="w-4 h-4 text-zinc-900" />
                  <span>Medios de Pago</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Aceptamos todas las tarjetas de crédito, débito, dinero en cuenta de MercadoPago y transferencias bancarias directas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
