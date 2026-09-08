"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Eye, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import Badge from "../ui/Badge";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { addToast } = useToast();

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const primaryImage = product.image_urls?.[0];
  const brandName = product.brand?.name || product.brand || "";
  const categoryName = product.subcategory?.category?.name || product.subcategory?.name || "";

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, null, 1);
    addToast(`"${product.name}" agregado al carrito`, "success");
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/80 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 overflow-hidden">
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.is_on_sale && (
          <Badge variant="emerald" size="sm">
            Oferta
          </Badge>
        )}
        {product.is_featured && (
          <Badge variant="rose" size="sm" className="flex items-center gap-1">
            <Sparkles size={10} /> Destacado
          </Badge>
        )}
      </div>

      {/* Image container */}
      <Link
        href={`/productos/${product.slug}`}
        className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center p-4"
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:text-rose-400 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-rose-50/60 flex items-center justify-center text-rose-500 font-black text-xl mb-1">
              {brandName ? brandName.charAt(0) : "A"}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Los Arrayanes
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {brandName && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 truncate">
                {brandName}
              </span>
            )}
            {categoryName && (
              <span className="text-[10px] font-medium text-slate-400 truncate">
                {categoryName}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {product.is_on_sale && product.sale_price ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPrice(product.base_price)}
                </span>
                <span className="text-base sm:text-lg font-black text-rose-600">
                  {formatPrice(product.sale_price)}
                </span>
              </div>
            ) : (
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-xs"
            title="Agregar al carrito"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingBag size={16} />
            <span className="text-xs font-bold hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
