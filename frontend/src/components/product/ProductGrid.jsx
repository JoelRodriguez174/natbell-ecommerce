"use client";

import React from "react";
import ProductCard from "./ProductCard";
import Skeleton from "../ui/Skeleton";

export default function ProductGrid({
  products = [],
  loading = false,
  emptyMessage = "No se encontraron productos con los filtros seleccionados.",
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-slate-200/80 p-4 space-y-4 shadow-xs"
          >
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center my-6">
        <p className="text-slate-600 font-semibold text-base">{emptyMessage}</p>
        <p className="text-slate-400 text-xs mt-1">
          Probá ajustando la búsqueda o quitando algunos filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id || product.slug} product={product} />
      ))}
    </div>
  );
}
