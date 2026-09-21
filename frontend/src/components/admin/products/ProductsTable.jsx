"use client";

import { Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function ProductsTable({
  products,
  isLoading,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 font-bold">Producto</th>
              <th className="py-3.5 px-4 font-bold">Categoría & Marca</th>
              <th className="py-3.5 px-4 font-bold">Precios</th>
              <th className="py-3.5 px-4 font-bold">Stock</th>
              <th className="py-3.5 px-4 font-bold">Estado</th>
              <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  <span>Cargando catálogo...</span>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  No se encontraron productos con el criterio de búsqueda.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock =
                  p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ??
                  p.stock ??
                  0;
                const isLowStock = totalStock <= 5;
                const firstImg =
                  p.image_urls?.[0] || p.images?.[0] || "/placeholder-cosmetics.png";

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Producto: Imagen + Nombre + SKU */}
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
                          <span className="font-mono text-[10px] text-zinc-400">
                            {p.variants?.[0]?.sku || "SKU N/A"}
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
  );
}
