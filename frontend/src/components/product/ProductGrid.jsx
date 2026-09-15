"use client";

import ProductCard from "./ProductCard";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { PackageX } from "lucide-react";

export default function ProductGrid({
  products = [],
  isLoading = false,
  emptyTitle = "No se encontraron productos",
  emptyDescription = "Intenta ajustar tus filtros de búsqueda o seleccionar otra categoría.",
  emptyActionLabel = "Limpiar todos los filtros",
  onResetFilters,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl bg-white border border-gray-200 p-2.5 sm:p-3.5 space-y-3 shadow-xs"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <div className="pt-2 flex justify-between items-center mt-auto border-t border-gray-100">
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 text-center rounded-xl bg-white border border-dashed border-gray-300">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <PackageX className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{emptyTitle}</h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-5 leading-relaxed">
          {emptyDescription}
        </p>
        {onResetFilters && (
          <Button variant="secondary" size="sm" onClick={onResetFilters} className="text-xs">
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
