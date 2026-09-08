"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);

  // New variant inline form state
  const [newVariant, setNewVariant] = useState({
    sku: "",
    variant_name: "",
    price_override: "",
    stock: "10",
  });
  const [creatingVariant, setCreatingVariant] = useState(false);

  const loadProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/products/${productId}`, {
        headers: adminAuth.getAuthHeaders(),
      });
      setProduct(data);
    } catch (e) {
      console.error("Error loading product:", e);
      addToast("Error al cargar producto", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({
          name: product.name,
          base_price: parseFloat(product.base_price),
          sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
          is_featured: product.is_featured,
          is_on_sale: product.is_on_sale,
          description: product.description,
          is_active: product.is_active,
        }),
      });
      addToast("Producto actualizado correctamente", "success");
    } catch (e) {
      addToast(e.message || "Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!newVariant.sku.trim() || !newVariant.variant_name.trim()) {
      addToast("Completa SKU y nombre de variante", "error");
      return;
    }
    setCreatingVariant(true);
    try {
      await apiFetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({
          sku: newVariant.sku.trim(),
          variant_name: newVariant.variant_name.trim(),
          price_override: newVariant.price_override
            ? parseFloat(newVariant.price_override)
            : null,
          stock: parseInt(newVariant.stock || "0", 10),
          is_active: true,
        }),
      });
      addToast("Variante agregada con éxito", "success");
      setNewVariant({ sku: "", variant_name: "", price_override: "", stock: "10" });
      loadProduct();
    } catch (e) {
      addToast(e.message || "Error al agregar variante", "error");
    } finally {
      setCreatingVariant(false);
    }
  };

  const handleUpdateVariantStock = async (variantId, newStock) => {
    try {
      await apiFetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({ stock: parseInt(newStock, 10) }),
      });
      addToast("Stock actualizado", "success");
      loadProduct();
    } catch (e) {
      addToast("Error al actualizar stock", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-slate-500">Producto no encontrado</div>;
  }

  const variants = product.variants || product.product_variants || [];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/productos"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a lista de productos</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Editar: {product.name}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          ID: <span className="font-mono">{product.id}</span>
        </p>
      </div>

      {/* Main product details form */}
      <form onSubmit={handleUpdateProduct} className="space-y-6">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Detalles Generales</h3>

          <Input
            label="Nombre del Producto"
            required
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="bg-slate-900 border-slate-800 text-white"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio Base ($)"
              type="number"
              step="0.01"
              required
              value={product.base_price}
              onChange={(e) =>
                setProduct({ ...product, base_price: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Precio de Oferta ($)"
              type="number"
              step="0.01"
              value={product.sale_price || ""}
              onChange={(e) =>
                setProduct({ ...product, sale_price: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_featured}
                onChange={(e) =>
                  setProduct({ ...product, is_featured: e.target.checked })
                }
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Destacado</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_on_sale}
                onChange={(e) =>
                  setProduct({ ...product, is_on_sale: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>En Oferta</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_active}
                onChange={(e) =>
                  setProduct({ ...product, is_active: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Activo en Tienda</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              value={product.description || ""}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
              className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
            >
              <Save size={16} />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Variants & Stock Management Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="font-bold text-white text-base">
            Variantes y Stock ({variants.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Administra tamaños, presentaciones, precios diferenciados e inventario.
          </p>
        </div>

        {/* Existing Variants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Variante</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Precio Sobrescrito</th>
                <th className="py-2.5 px-3">Stock Actual</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No hay variantes asignadas a este producto.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 px-3 font-bold text-white">
                      {v.variant_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {v.sku}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {v.price_override ? `$${v.price_override}` : "Usa precio base"}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        defaultValue={v.stock}
                        onBlur={(e) =>
                          handleUpdateVariantStock(v.id, e.target.value)
                        }
                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-bold text-center"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          v.is_active
                            ? "bg-emerald-950 text-emerald-400"
                            : "bg-red-950 text-red-400"
                        }`}
                      >
                        {v.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add new variant inline */}
        <form
          onSubmit={handleAddVariant}
          className="pt-4 border-t border-slate-800 space-y-3"
        >
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            + Agregar Nueva Variante
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Nombre (ej: 1900ml)"
              value={newVariant.variant_name}
              onChange={(e) =>
                setNewVariant({ ...newVariant, variant_name: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white text-xs"
            />
            <Input
              placeholder="SKU (ej: 40062)"
              value={newVariant.sku}
              onChange={(e) =>
                setNewVariant({ ...newVariant, sku: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white text-xs"
            />
            <Input
              placeholder="Precio ($ override opcional)"
              type="number"
              step="0.01"
              value={newVariant.price_override}
              onChange={(e) =>
                setNewVariant({
                  ...newVariant,
                  price_override: e.target.value,
                })
              }
              className="bg-slate-900 border-slate-800 text-white text-xs"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Stock"
                type="number"
                value={newVariant.stock}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, stock: e.target.value })
                }
                className="bg-slate-900 border-slate-800 text-white text-xs"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={creatingVariant}
              >
                Agregar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
