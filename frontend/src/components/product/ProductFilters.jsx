"use client";

import { useState } from "react";
import { Filter, X, ChevronRight, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function ProductFilters({
  categories = [],
  brands = [],
  selectedCategory = "",
  selectedBrand = "",
  minPrice = "",
  maxPrice = "",
  onSale = false,
  onFilterChange,
  onResetFilters,
}) {
  const [localMin, setLocalMin] = useState("");
  const [localMax, setLocalMax] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    onFilterChange({
      min_price: localMin ? Number(localMin) : undefined,
      max_price: localMax ? Number(localMax) : undefined,
      page: 1,
    });
    setLocalMin("");
    setLocalMax("");
  };

  const handleReset = () => {
    setLocalMin("");
    setLocalMax("");
    onResetFilters();
  };

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 6);
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 6);

  return (
    <>
      {/* Botón trigger para mobile */}
      <div className="lg:hidden mb-4 w-full">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex flex-row items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:border-gray-400 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Filter className="w-4 h-4 text-gray-600 shrink-0" />
          <span>{mobileOpen ? "Ocultar Filtros" : "Filtrar Catálogo"}</span>
        </button>
      </div>

      {/* Sidebar estilo minimalista en desktop / Card delimitada en mobile */}
      <aside
        className={cn(
          "w-full lg:w-52 shrink-0 space-y-6 pt-1",
          mobileOpen
            ? "block bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs mb-6 lg:bg-transparent lg:p-0 lg:border-none lg:shadow-none lg:mb-0"
            : "hidden lg:block"
        )}
      >
        {/* Limpiar filtros si hay activos */}
        {(selectedCategory || selectedBrand || minPrice || maxPrice || onSale) && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">Filtros aplicados</span>
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        )}

        {/* Promociones / Ofertas */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-2.5">
            Promociones
          </h3>
          <label className="flex items-center gap-2.5 cursor-pointer text-xs group select-none">
            <input
              type="checkbox"
              checked={Boolean(onSale)}
              onChange={(e) =>
                onFilterChange({
                  on_sale: e.target.checked ? true : undefined,
                  page: 1,
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
            />
            <span
              className={cn(
                "transition-colors",
                onSale
                  ? "font-bold text-rose-600"
                  : "text-gray-700 group-hover:text-black"
              )}
            >
              Solo productos en oferta
            </span>
          </label>
        </div>

        {/* Contenedor dividido en celular: Categorías a la izquierda, Marcas a la derecha */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:block lg:space-y-7 pt-1">
          {/* Categorías */}
          <div className="border-r border-gray-100 pr-2 sm:pr-3 lg:border-none lg:pr-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight mb-2">
              Categorías
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs">
              <li>
                <button
                  onClick={() => onFilterChange({ category: undefined, page: 1 })}
                  className={cn(
                    "text-left block py-0.5 hover:text-black transition-colors cursor-pointer w-full truncate",
                    !selectedCategory
                      ? "font-bold text-gray-950"
                      : "text-gray-600 font-normal hover:underline"
                  )}
                  title="Todas las categorías"
                >
                  Todas
                </button>
              </li>

              {visibleCategories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onFilterChange({ category: cat.slug, page: 1 })}
                    className={cn(
                      "text-left block py-0.5 hover:text-black transition-colors cursor-pointer w-full truncate",
                      selectedCategory === cat.slug
                        ? "font-bold text-gray-950"
                        : "text-gray-600 font-normal hover:underline"
                    )}
                    title={cat.name}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>

            {categories.length > 6 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-1.5 text-[11px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>{showAllCategories ? "Menos" : `+${categories.length - 6} más`}</span>
              </button>
            )}
          </div>

          {/* Marcas */}
          <div className="pl-1 lg:pl-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight mb-2">
              Marcas
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs">
              <li>
                <button
                  onClick={() => onFilterChange({ brand: undefined, page: 1 })}
                  className={cn(
                    "text-left block py-0.5 hover:text-black transition-colors cursor-pointer w-full truncate",
                    !selectedBrand
                      ? "font-bold text-gray-950"
                      : "text-gray-600 font-normal hover:underline"
                  )}
                  title="Todas las marcas"
                >
                  Todas
                </button>
              </li>

              {visibleBrands.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => onFilterChange({ brand: b.slug, page: 1 })}
                    className={cn(
                      "text-left block py-0.5 hover:text-black transition-colors cursor-pointer w-full truncate",
                      selectedBrand === b.slug
                        ? "font-bold text-gray-950"
                        : "text-gray-600 font-normal hover:underline"
                    )}
                    title={b.name}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>

            {brands.length > 6 && (
              <button
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="mt-1.5 text-[11px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>{showAllBrands ? "Menos" : `+${brands.length - 6} más`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Rango de Precios minimalista */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-2.5">
            Precio
          </h3>
          <form onSubmit={handleApplyPrice} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black outline-none"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Máximo"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-full text-xs font-semibold py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md border border-gray-200"
            >
              Aplicar precio
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
