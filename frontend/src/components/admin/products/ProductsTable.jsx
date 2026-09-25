"use client";

import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function ProductsTable({
  products = [],
  isLoading = false,
  onEdit,
  onDelete,
}) {
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "paused" | "low_stock"

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-500 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-500 font-bold shrink-0" />
    );
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    // 1. Filtrado por estado
    const filtered = products.filter((p) => {
      const totalStock =
        p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ??
        p.stock ??
        0;

      if (statusFilter === "active") return p.is_active !== false;
      if (statusFilter === "paused") return p.is_active === false;
      if (statusFilter === "low_stock") return totalStock <= 5;
      return true;
    });

    // 2. Ordenamiento por columna clickeable
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name": {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "id": {
          const idA = String(a.variants?.[0]?.sku || a.sku || a.id || "").toLowerCase();
          const idB = String(b.variants?.[0]?.sku || b.sku || b.id || "").toLowerCase();
          comparison = idA.localeCompare(idB);
          break;
        }
        case "category": {
          const catA = (a.category_name || a.categories?.name || "").toLowerCase();
          const catB = (b.category_name || b.categories?.name || "").toLowerCase();
          comparison = catA.localeCompare(catB);
          break;
        }
        case "price": {
          const priceA = Number(a.sale_price && a.is_on_sale ? a.sale_price : a.base_price || 0);
          const priceB = Number(b.sale_price && b.is_on_sale ? b.sale_price : b.base_price || 0);
          comparison = priceA - priceB;
          break;
        }
        case "stock": {
          const stockA =
            a.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? a.stock ?? 0;
          const stockB =
            b.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? b.stock ?? 0;
          comparison = stockA - stockB;
          break;
        }
        case "status": {
          const statusA = a.is_active !== false ? 1 : 0;
          const statusB = b.is_active !== false ? 1 : 0;
          comparison = statusA - statusB;
          break;
        }
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection, statusFilter]);

  return (
    <div className="space-y-3">
      {/* Pestañas de filtrado rápido por Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paused")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              statusFilter === "paused"
                ? "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Pausados
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("low_stock")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              statusFilter === "low_stock"
                ? "bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Bajo Stock (≤5)
          </button>
        </div>

        {/* Indicador de orden actual */}
        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <span>Orden actual:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
            {sortField === "name" && "Nombre"}
            {sortField === "id" && "ID / SKU"}
            {sortField === "category" && "Categoría"}
            {sortField === "price" && "Precio"}
            {sortField === "stock" && "Stock"}
            {sortField === "status" && "Estado"}
          </span>
          <span className="text-amber-500 font-bold">
            ({sortDirection === "asc" ? "Ascendente ▲" : "Descendente ▼"})
          </span>
        </div>
      </div>

      {/* Tabla con cabeceras ordenables */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 select-none">
              <tr>
                {/* 1. ID / SKU Ordenable */}
                <th
                  onClick={() => handleSort("id")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por SKU / ID (Ascendente / Descendente)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID / SKU</span>
                    {getSortIcon("id")}
                  </div>
                </th>

                {/* 2. Producto / Nombre Ordenable */}
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por Nombre de Producto (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Producto</span>
                    {getSortIcon("name")}
                  </div>
                </th>

                {/* 3. Categoría & Marca Ordenable */}
                <th
                  onClick={() => handleSort("category")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por Categoría (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoría & Marca</span>
                    {getSortIcon("category")}
                  </div>
                </th>

                {/* 4. Precios Ordenable */}
                <th
                  onClick={() => handleSort("price")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por Precio (Menor a Mayor / Mayor a Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Precios</span>
                    {getSortIcon("price")}
                  </div>
                </th>

                {/* 5. Stock Ordenable */}
                <th
                  onClick={() => handleSort("stock")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por Stock (Menor a Mayor / Mayor a Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stock</span>
                    {getSortIcon("stock")}
                  </div>
                </th>

                {/* 6. Estado Ordenable */}
                <th
                  onClick={() => handleSort("status")}
                  className="py-3.5 px-4 font-bold cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Ordenar por Estado (Activos / Pausados)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado</span>
                    {getSortIcon("status")}
                  </div>
                </th>

                {/* 7. Acciones */}
                <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Cargando catálogo...</span>
                  </td>
                </tr>
              ) : filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No se encontraron productos con el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((p) => {
                  const totalStock =
                    p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ??
                    p.stock ??
                    0;
                  const isLowStock = totalStock <= 5;
                  const firstImg =
                    p.image_urls?.[0] || p.images?.[0] || "/placeholder-cosmetics.png";
                  const sku = p.variants?.[0]?.sku || p.sku || "N/A";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* ID / SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                          {sku}
                        </span>
                      </td>

                      {/* Producto: Imagen + Nombre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={firstImg}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {p.name}
                            </p>
                            <span className="text-[10px] text-zinc-400">
                              {p.variants?.[0]?.variant_name || "Estándar"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoría & Marca */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {p.category_name || "Sin categoría"}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {p.brand_name || "Sin marca"}
                        </span>
                      </td>

                      {/* Precios */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {formatCurrency(p.base_price)}
                          </span>
                          {p.is_on_sale && p.sale_price && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Oferta: {formatCurrency(p.sale_price)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isLowStock
                              ? "text-red-600 dark:text-red-400"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {isLowStock && <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{totalStock} u.</span>
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.is_active !== false
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {p.is_active !== false ? "Activo" : "Pausado"}
                          </span>
                          {p.is_on_sale && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Oferta
                            </span>
                          )}
                          {p.is_featured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Destacado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            title="Editar / Modificar producto"
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
                            title="Eliminar producto"
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
