import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra de migas de pan y filtros activos en el catálogo de productos.
 * Integrada con la paleta Natbell (Magenta #DE1B76 y Verde #5EB82D).
 */
export default function CatalogBreadcrumbs({
  category = "",
  brand = "",
  q = "",
  onSale = false,
  minPrice = "",
  maxPrice = "",
  currentCategoryName = "",
  currentBrandName = "",
  onFilterChange,
  onResetFilters,
}) {
  const hasActiveFilters = Boolean(category || brand || q || minPrice || maxPrice || onSale);

  return (
    <nav aria-label="Ruta de filtros" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
      <Link
        href="/productos"
        className={cn(
          "hover:text-[#DE1B76] transition-colors",
          !hasActiveFilters ? "text-gray-900 font-bold" : "text-gray-500"
        )}
      >
        Catálogo
      </Link>

      {onSale && (
        <>
          <span className="text-gray-300 select-none">&gt;</span>
          <div className="inline-flex items-center gap-1 bg-rose-50/80 px-2 py-0.5 rounded-md border border-rose-100">
            <span className="text-[#DE1B76] font-bold">Ofertas</span>
            <button
              type="button"
              onClick={() => onFilterChange({ on_sale: undefined, page: 1 })}
              className="text-gray-400 hover:text-[#DE1B76] transition-colors cursor-pointer"
              title="Quitar filtro de ofertas"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {category && (
        <>
          <span className="text-gray-300 select-none">&gt;</span>
          <div className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
            <Link
              href={onSale ? `/productos?on_sale=true&category=${category}` : `/productos?category=${category}`}
              className="hover:text-[#DE1B76] text-gray-800 font-semibold transition-colors"
            >
              {currentCategoryName}
            </Link>
            <button
              type="button"
              onClick={() => onFilterChange({ category: undefined, page: 1 })}
              className="text-gray-400 hover:text-[#DE1B76] transition-colors cursor-pointer"
              title="Quitar categoría"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {brand && (
        <>
          <span className="text-gray-300 select-none">&gt;</span>
          <div className="inline-flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
            <span className="text-[#5EB82D] font-bold">{currentBrandName}</span>
            <button
              type="button"
              onClick={() => onFilterChange({ brand: undefined, page: 1 })}
              className="text-gray-400 hover:text-[#DE1B76] transition-colors cursor-pointer"
              title="Quitar marca"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {q && (
        <>
          <span className="text-gray-300 select-none">&gt;</span>
          <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
            <span className="text-gray-800 font-semibold">&ldquo;{q}&rdquo;</span>
            <button
              type="button"
              onClick={() => onFilterChange({ q: undefined, page: 1 })}
              className="text-gray-400 hover:text-[#DE1B76] transition-colors cursor-pointer"
              title="Quitar búsqueda"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {(minPrice || maxPrice) && (
        <>
          <span className="text-gray-300 select-none">&gt;</span>
          <div className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
            <span className="text-gray-800 font-semibold">
              ${minPrice || 0} - ${maxPrice || "máx"}
            </span>
            <button
              type="button"
              onClick={() => onFilterChange({ min_price: undefined, max_price: undefined, page: 1 })}
              className="text-gray-400 hover:text-[#DE1B76] transition-colors cursor-pointer"
              title="Quitar filtro de precio"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className="ml-2 text-xs text-[#DE1B76] hover:text-[#c21464] underline underline-offset-2 cursor-pointer font-bold transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </nav>
  );
}
