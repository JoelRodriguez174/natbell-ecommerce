"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";
import { formatCurrency } from "../../../lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminProductosPage() {
  const { token } = useAdminAuthStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal para nuevo producto
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdSalePrice, setNewProdSalePrice] = useState("");
  const [newProdIsOnSale, setNewProdIsOnSale] = useState(false);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(false);
  const [newProdImages, setNewProdImages] = useState([]);
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdVariantName, setNewProdVariantName] = useState("Estándar");
  const [newProdStock, setNewProdStock] = useState(10);

  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`${API_URL}/api/products?per_page=50${search ? `&search=${encodeURIComponent(search)}` : ""}`),
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/brands`),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.items || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData || []);
        if (cData.length > 0 && !newProdCategory) setNewProdCategory(cData[0].id);
      }
      if (brandRes.ok) {
        const bData = await brandRes.json();
        setBrands(bData || []);
        if (bData.length > 0 && !newProdBrand) setNewProdBrand(bData[0].id);
      }
    } catch {
      setFeedback({ type: "error", message: "Error al conectar con el servidor." });
    } finally {
      setIsLoading(false);
    }
  }, [search, newProdCategory, newProdBrand]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Error subiendo imagen");
      const data = await res.json();
      setNewProdImages((prev) => [...prev, data.url]);
    } catch (err) {
      alert(err.message || "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      name: newProdName,
      description: newProdDesc || null,
      category_id: newProdCategory,
      brand_id: newProdBrand,
      base_price: parseFloat(newProdPrice),
      sale_price: newProdIsOnSale && newProdSalePrice ? parseFloat(newProdSalePrice) : null,
      is_on_sale: newProdIsOnSale,
      is_featured: newProdIsFeatured,
      images: newProdImages,
      variants: [
        {
          sku: newProdSku || `SKU-${Date.now().toString().slice(-6)}`,
          variant_name: newProdVariantName || "Estándar",
          stock: parseInt(newProdStock, 10) || 0,
        },
      ],
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al crear producto");
      }

      setFeedback({ type: "success", message: "¡Producto creado exitosamente!" });
      setIsCreateModalOpen(false);
      // Reset form
      setNewProdName("");
      setNewProdDesc("");
      setNewProdPrice("");
      setNewProdSalePrice("");
      setNewProdImages([]);
      setNewProdSku("");
      fetchCatalogData();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de que deseas desactivar '${productName}'?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo desactivar el producto");
      setFeedback({ type: "success", message: `Producto '${productName}' desactivado correctamente.` });
      fetchCatalogData();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Administrá el stock, precios, variantes e imágenes de la tienda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre de producto..."
          className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none w-full"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Producto</th>
                <th className="py-3.5 px-4 font-bold">Categoría / Marca</th>
                <th className="py-3.5 px-4 font-bold">Precio</th>
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
                    <span>Cargando productos...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const totalStock =
                    prod.variants && prod.variants.length > 0
                      ? prod.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                      : prod.in_stock
                      ? "En stock"
                      : "Agotado";
                  const mainImage = (prod.images && prod.images[0]) || (prod.image_urls && prod.image_urls[0]) || `/products/${prod.slug}.webp`;

                  return (
                    <tr key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden relative shrink-0">
                            <Image
                              src={mainImage}
                              alt={prod.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">{prod.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          {prod.category_name || prod.category?.name || "Sin categoría"}
                        </p>
                        <p className="text-[10px] text-zinc-400">{prod.brand_name || prod.brand?.name || "Sin marca"}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(prod.is_on_sale && prod.sale_price ? prod.sale_price : prod.base_price)}
                        </span>
                        {prod.is_on_sale && (
                          <span className="text-[10px] text-zinc-400 line-through block">
                            {formatCurrency(prod.base_price)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            (typeof totalStock === "number" && totalStock <= 5) || totalStock === "Agotado"
                              ? "text-red-500 font-bold"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {typeof totalStock === "number" ? `${totalStock} un.` : totalStock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.is_active !== false
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {prod.is_active !== false ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Desactivar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Producto */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Nuevo Producto
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej: Máquina Cortadora Wahl Legend"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Marca *
                  </label>
                  <select
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Base (ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="9999.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Oferta (ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!newProdIsOnSale}
                    value={newProdSalePrice}
                    onChange={(e) => setNewProdSalePrice(e.target.value)}
                    placeholder="7999.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsOnSale}
                    onChange={(e) => setNewProdIsOnSale(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>En Oferta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsFeatured}
                    onChange={(e) => setNewProdIsFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Producto Destacado</span>
                </label>
              </div>

              {/* Variante inicial */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Inventario Inicial
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">SKU</label>
                    <input
                      type="text"
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      placeholder="WAHL-001"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Nombre Variante</label>
                    <input
                      type="text"
                      value={newProdVariantName}
                      onChange={(e) => setNewProdVariantName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Stock *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Imagen */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Foto del Producto (Supabase Storage)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-center cursor-pointer hover:border-amber-500 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-500">
                      {isUploading ? "Subiendo a Storage..." : "Seleccionar imagen..."}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {newProdImages.length > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                    ✓ Imagen cargada: {newProdImages[0]}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
