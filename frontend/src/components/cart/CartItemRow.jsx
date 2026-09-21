"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export default function CartItemRow({ item, onUpdateQuantity, onRemoveItem }) {
  const handleQuantityInput = (e) => {
    const val = e.target.value;
    if (val === "") return;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const limit = item.maxStock != null ? item.maxStock : 99;
    if (parsed > limit) {
      onUpdateQuantity(item.itemKey, limit);
    } else if (parsed <= 0) {
      onUpdateQuantity(item.itemKey, 1);
    } else {
      onUpdateQuantity(item.itemKey, parsed);
    }
  };

  const limit = item.maxStock != null ? item.maxStock : 99;

  return (
    <div
      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-gray-50/50 transition-colors"
      data-testid={`cart-page-item-${item.itemKey}`}
    >
      {/* Foto y Datos Principales */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
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
            onClick={() => onUpdateQuantity(item.itemKey, item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors cursor-pointer"
            aria-label="Disminuir cantidad"
            data-testid={`cart-page-qty-dec-${item.itemKey}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            max={limit}
            value={item.quantity}
            onChange={handleQuantityInput}
            className="w-12 text-center text-xs font-bold text-gray-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantidad"
            data-testid={`cart-page-qty-input-${item.itemKey}`}
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.itemKey, item.quantity + 1)}
            disabled={item.quantity >= limit}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Aumentar cantidad"
            data-testid={`cart-page-qty-inc-${item.itemKey}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal del Producto */}
        <div className="text-right min-w-[90px]">
          <p className="text-sm font-extrabold text-gray-900">
            {formatCurrency(item.price * item.quantity)}
          </p>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            {formatCurrency(item.price)} c/u
          </p>
        </div>

        {/* Botón Eliminar Ítem */}
        <button
          type="button"
          onClick={() => onRemoveItem(item.itemKey)}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
          title="Eliminar producto"
          aria-label="Eliminar producto del carrito"
          data-testid={`cart-page-remove-${item.itemKey}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
