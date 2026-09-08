"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminProductsPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `&q=${encodeURIComponent(search.trim())}` : "";
      const data = await apiFetch(`/api/admin/products?page=${page}&per_page=25${q}`, {
        headers: adminAuth.getAuthHeaders(),
      });
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading admin products:", e);
      addToast("Error al cargar productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleToggleActive = async (product) => {
    try {
      await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      addToast(
        `Producto ${product.is_active ? "desactivado" : "activado"} correctamente`,
        "success"
      );
      loadProducts();
    } catch (e) {
      addToast(e.message || "Error al actualizar producto", "error");
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {total} productos en base de datos.
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button variant="primary" size="md">
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </Button>
        </Link>
      </div>

      {/* Search Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl"
      >
        <Search size={18} className="text-slate-500 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
        />
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Marca</th>
                <th className="py-3 px-4">Precio Base</th>
                <th className="py-3 px-4">Variantes</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const variants = p.product_variants || [];
                  const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            {p.image_urls?.[0] ? (
                              <img
                                src={p.image_urls[0]}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-slate-600 font-bold text-xs">LA</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {p.brand?.name || "-"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        {formatPrice(p.base_price)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-semibold">{variants.length}</span>{" "}
                        <span className="text-slate-500">({totalStock} unid.)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.is_active
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {p.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={p.is_active ? "Desactivar" : "Activar"}
                          >
                            {p.is_active ? (
                              <XCircle size={15} className="text-red-400" />
                            ) : (
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            )}
                          </button>
                          <Link
                            href={`/admin/productos/${p.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 size={15} />
                          </Link>
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
