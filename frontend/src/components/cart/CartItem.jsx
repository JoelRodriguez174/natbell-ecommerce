"use client";

import React from "react";
import Image from "next/image";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-b-0">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
        {item.image && item.image !== "/placeholder-product.png" ? (
          <img
            src={item.image}
            alt={item.product_name}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500 font-bold text-xs">
            LA
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate leading-snug">
          {item.product_name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {item.variant_name}
          </span>
          {item.max_stock <= 5 && (
            <span className="text-[10px] text-amber-600 font-medium">
              ¡Últimos {item.max_stock}!
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-slate-900 mt-1.5">
          {formatPrice(item.price)}
        </div>
      </div>

      {/* Counter and Remove */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
            className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Disminuir"
          >
            <Minus size={13} />
          </button>
          <span className="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
            disabled={item.quantity >= item.max_stock}
            className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Aumentar"
          >
            <Plus size={13} />
          </button>
        </div>

        <button
          onClick={() => onRemove(item.variant_id)}
          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
          title="Eliminar producto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
