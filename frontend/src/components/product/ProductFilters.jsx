"use client";

import React from "react";
import { Filter, X, RotateCcw } from "lucide-react";

export default function ProductFilters({
  categories = [],
  brands = [],
  selectedCategory = "",
  selectedSubcategory = "",
  selectedBrand = "",
  minPrice = "",
  maxPrice = "",
  onFilterChange,
  onResetFilters,
}) {
  const activeFiltersCount = [
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-rose-600" />
          <h3 className="font-bold text-slate-900 text-sm">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium"
          >
            <RotateCcw size={12} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Category selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Categoría
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id || cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Brand selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Marca
        </label>
        <select
          value={selectedBrand}
          onChange={(e) => onFilterChange("brand", e.target.value)}
          className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.id || b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Rango de Precio ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => onFilterChange("min_price", e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-rose-500"
          />
          <input
            type="number"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => onFilterChange("max_price", e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 text-slate-800 outline-none focus:border-rose-500"
          />
        </div>
      </div>
    </div>
  );
}
