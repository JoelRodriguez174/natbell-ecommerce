"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminNewProductPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    brand_id: "",
    category_id: "",
    subcategory_id: "",
    base_price: "",
    sale_price: "",
    is_featured: false,
    is_on_sale: false,
    description: "",
    image_url: "",
    // Initial variant
    sku: "",
    variant_name: "Estándar",
    stock: "10",
  });

  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const [cats, brs] = await Promise.all([
          apiFetch("/api/categories"),
          apiFetch("/api/brands"),
        ]);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(brs)) {
          setBrands(brs);
          if (brs.length > 0) {
            setFormData((prev) => ({ ...prev, brand_id: brs[0].id }));
          }
        }
      } catch (e) {
        console.error("Error loading categories or brands:", e);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // When category changes, update subcategories
  const handleCategoryChange = (catId) => {
    setFormData((prev) => ({ ...prev, category_id: catId, subcategory_id: "" }));
    const selected = categories.find((c) => c.id === catId);
    if (selected && selected.subcategories) {
      setSubcategories(selected.subcategories);
      if (selected.subcategories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          subcategory_id: selected.subcategories[0].id,
        }));
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.base_price || !formData.brand_id) {
      addToast("Completa los campos obligatorios", "error");
      return;
    }

    setSubmitting(true);
    try {
      const productPayload = {
        name: formData.name.trim(),
        brand_id: formData.brand_id,
        subcategory_id: formData.subcategory_id || categories[0]?.subcategories?.[0]?.id,
        base_price: parseFloat(formData.base_price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        is_featured: formData.is_featured,
        is_on_sale: formData.is_on_sale,
        description: formData.description.trim() || null,
        image_urls: formData.image_url ? [formData.image_url.trim()] : [],
        is_active: true,
      };

      // 1. Create product
      const product = await apiFetch("/api/admin/products", {
        method: "POST",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify(productPayload),
      });

      // 2. Create initial variant if SKU given
      if (product.id && (formData.sku.trim() || formData.stock)) {
        await apiFetch(`/api/admin/products/${product.id}/variants`, {
          method: "POST",
          headers: adminAuth.getAuthHeaders(),
          body: JSON.stringify({
            sku: formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
            variant_name: formData.variant_name.trim() || "Estándar",
            stock: parseInt(formData.stock || "0", 10),
            is_active: true,
          }),
        });
      }

      addToast("¡Producto creado con éxito!", "success");
      router.push("/admin/productos");
    } catch (e) {
      console.error("Error creating product:", e);
      addToast(e.message || "Error al crear producto", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/productos"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a productos</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Crear Nuevo Producto
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Agrega un producto al catálogo con sus precios y variante inicial.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Información Básica</h3>

          <Input
            label="Nombre del Producto"
            required
            placeholder="Ej: Nov Native Shampoo Keratina"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Marca <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.brand_id}
                onChange={(e) =>
                  setFormData({ ...formData, brand_id: e.target.value })
                }
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-rose-500"
              >
                <option value="">Seleccionar marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Categoría Principal
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-rose-500"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {subcategories.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Subcategoría
              </label>
              <select
                value={formData.subcategory_id}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory_id: e.target.value })
                }
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-rose-500"
              >
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              URL de Imagen Principal
            </label>
            <Input
              placeholder="https://... o /placeholder-product.png"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Fórmula enriquecida con aminoácidos..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 p-3 text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Pricing & Flags */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Precios y Promociones</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio Base ($)"
              type="number"
              step="0.01"
              required
              placeholder="Ej: 8500"
              value={formData.base_price}
              onChange={(e) =>
                setFormData({ ...formData, base_price: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
            />

            <Input
              label="Precio de Oferta ($)"
              type="number"
              step="0.01"
              placeholder="Ej: 7200 (opcional)"
              value={formData.sale_price}
              onChange={(e) =>
                setFormData({ ...formData, sale_price: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({ ...formData, is_featured: e.target.checked })
                }
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Producto Destacado</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_on_sale}
                onChange={(e) =>
                  setFormData({ ...formData, is_on_sale: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>En Oferta</span>
            </label>
          </div>
        </div>

        {/* Initial Variant */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Variante Inicial / Stock</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nombre Variante"
              placeholder="Ej: 240ml, 1900ml, 7.1"
              value={formData.variant_name}
              onChange={(e) =>
                setFormData({ ...formData, variant_name: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Código SKU"
              placeholder="Ej: NOV-40061"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Stock Inicial"
              type="number"
              placeholder="Ej: 25"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/productos">
            <Button variant="outline" size="md">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
          >
            Guardar Producto
          </Button>
        </div>
      </form>
    </div>
  );
}
