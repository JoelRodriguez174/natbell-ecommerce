"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Upload,
  X,
  Pencil,
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

  // Modal State (Creación / Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(null);
  const [urlInput, setUrlInput] = useState("");

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formIsOnSale, setFormIsOnSale] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImages, setFormImages] = useState([]);
  const [formSku, setFormSku] = useState("");
  const [formVariantName, setFormVariantName] = useState("Estándar");
  const [formStock, setFormStock] = useState(10);

  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(
          `${API_URL}/api/products?per_page=50${
            search ? `&search=${encodeURIComponent(search)}` : ""
          }`
        ),
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
        if (cData.length > 0 && !formCategory) setFormCategory(cData[0].id);
      }
      if (brandRes.ok) {
        const bData = await brandRes.json();
        setBrands(bData || []);
        if (bData.length > 0 && !formBrand) setFormBrand(bData[0].id);
      }
    } catch {
      setFeedback({ type: "error", message: "Error al conectar con el servidor." });
    } finally {
      setIsLoading(false);
    }
  }, [search, formCategory, formBrand]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // Abrir Modal para Crear Producto
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingProductId(null);
    setEditingVariantId(null);
    setFormName("");
    setFormDesc("");
    setFormCategory(categories[0]?.id || "");
    setFormBrand(brands[0]?.id || "");
    setFormPrice("");
    setFormSalePrice("");
    setFormIsOnSale(false);
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormVariantName("Estándar");
    setFormStock(10);
    setFormImages([]);
    setUrlInput("");
    setUploadingPreview(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar Producto Existente
  const handleOpenEditModal = async (prod) => {
    setModalMode("edit");
    setEditingProductId(prod.id);
    setEditingVariantId(null);
    setUrlInput("");
    setUploadingPreview(null);

    // Carga inicial inmediata con los datos de la fila
    setFormName(prod.name || "");
    setFormDesc(prod.description || "");
    setFormPrice(prod.base_price !== undefined ? String(prod.base_price) : "");
    setFormSalePrice(
      prod.sale_price !== undefined && prod.sale_price !== null
        ? String(prod.sale_price)
        : ""
    );
    setFormIsOnSale(Boolean(prod.is_on_sale));
    setFormIsFeatured(Boolean(prod.is_featured));
    setFormIsActive(prod.is_active !== false);

    const initialImgs =
      prod.image_urls && prod.image_urls.length > 0
        ? [...prod.image_urls]
        : prod.images && prod.images.length > 0
        ? [...prod.images]
        : [];
    setFormImages(initialImgs);

    // Matching de categoría y marca por id o por nombre/slug
    const matchedCategory = categories.find(
      (c) =>
        c.id === prod.category_id ||
        c.name === prod.category_name ||
        c.slug === prod.category_slug
    );
    setFormCategory(matchedCategory?.id || prod.category_id || categories[0]?.id || "");

    const matchedBrand = brands.find(
      (b) =>
        b.id === prod.brand_id ||
        b.name === prod.brand_name ||
        b.slug === prod.brand_slug
    );
    setFormBrand(matchedBrand?.id || prod.brand_id || brands[0]?.id || "");

    const initialStock =
      prod.variants?.[0]?.stock ??
      (typeof prod.stock === "number" ? prod.stock : 0);
    setFormStock(initialStock);

    if (prod.variants?.[0]?.id) {
      setEditingVariantId(prod.variants[0].id);
      setFormSku(prod.variants[0].sku || "");
      setFormVariantName(prod.variants[0].variant_name || "Estándar");
    }

    setIsModalOpen(true);

    // Si tiene slug, traer información ampliada (descripción completa, variantes)
    if (prod.slug) {
      try {
        const detailRes = await fetch(`${API_URL}/api/products/${prod.slug}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          if (detail.description !== undefined && detail.description !== null) {
            setFormDesc(detail.description);
          }
          if (detail.category_id) setFormCategory(detail.category_id);
          if (detail.brand_id) setFormBrand(detail.brand_id);
          if (detail.image_urls && detail.image_urls.length > 0) {
            setFormImages(detail.image_urls);
          }
          if (detail.variants && detail.variants.length > 0) {
            setEditingVariantId(detail.variants[0].id);
            setFormStock(detail.variants[0].stock ?? 0);
            setFormSku(detail.variants[0].sku || "");
            setFormVariantName(detail.variants[0].variant_name || "Estándar");
          }
        }
      } catch (err) {
        console.error("Error al cargar detalle extendido del producto:", err);
      }
    }
  };

  // Subida de imagen a Supabase Storage con previsualización inmediata
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Previsualización instantánea en memoria
    const localPreviewUrl = URL.createObjectURL(file);
    setUploadingPreview(localPreviewUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al subir la imagen");
      }
      const data = await res.json();
      setFormImages((prev) => [...prev, data.url]);
    } catch (err) {
      alert(err.message || "Error al subir imagen");
    } finally {
      setIsUploading(false);
      setUploadingPreview(null);
      e.target.value = "";
    }
  };

  // Agregar imagen mediante URL directa
  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;
    setFormImages((prev) => [...prev, clean]);
    setUrlInput("");
  };

  // Remover imagen del producto
  const handleRemoveImage = (indexToRemove) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Guardar (Crear o Actualizar) Producto
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setFeedback(null);

    const isEdit = modalMode === "edit";

    try {
      if (isEdit) {
        // PUT /api/admin/products/{id}
        const updatePayload = {
          name: formName.trim(),
          description: formDesc.trim() || null,
          category_id: formCategory || null,
          brand_id: formBrand || null,
          base_price: parseFloat(formPrice),
          sale_price:
            formIsOnSale && formSalePrice ? parseFloat(formSalePrice) : null,
          is_on_sale: formIsOnSale,
          is_featured: formIsFeatured,
          is_active: formIsActive,
          images: formImages,
        };

        const res = await fetch(`${API_URL}/api/admin/products/${editingProductId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error al actualizar producto");
        }

        // Si tiene variante asociada, sincronizar stock
        if (editingVariantId && formStock !== "") {
          await fetch(`${API_URL}/api/admin/variants/${editingVariantId}/stock`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stock: parseInt(formStock, 10) || 0 }),
          }).catch((err) =>
            console.error("Error sincronizando stock de variante:", err)
          );
        }

        setFeedback({
          type: "success",
          message: `¡Producto '${formName}' actualizado exitosamente!`,
        });
      } else {
        // POST /api/admin/products
        const createPayload = {
          name: formName.trim(),
          description: formDesc.trim() || null,
          category_id: formCategory,
          brand_id: formBrand,
          base_price: parseFloat(formPrice),
          sale_price:
            formIsOnSale && formSalePrice ? parseFloat(formSalePrice) : null,
          is_on_sale: formIsOnSale,
          is_featured: formIsFeatured,
          is_active: formIsActive,
          images: formImages,
          variants: [
            {
              sku: formSku || `SKU-${Date.now().toString().slice(-6)}`,
              variant_name: formVariantName || "Estándar",
              stock: parseInt(formStock, 10) || 0,
            },
          ],
        };

        const res = await fetch(`${API_URL}/api/admin/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(createPayload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error al crear producto");
        }

        setFeedback({
          type: "success",
          message: `¡Producto '${formName}' creado exitosamente!`,
        });
      }

      setIsModalOpen(false);
      fetchCatalogData();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Desactivar / Eliminar Producto
  const handleDeleteProduct = async (productId, productName) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de que deseas desactivar '${productName}'?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo desactivar el producto");
      setFeedback({
        type: "success",
        message: `Producto '${productName}' desactivado correctamente.`,
      });
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
            Administrá el stock, precios, variantes, descripciones e imágenes de la tienda.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
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
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría / Marca</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Stock Total</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
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
                  const mainImage =
                    (prod.images && prod.images[0]) ||
                    (prod.image_urls && prod.image_urls[0]) ||
                    `/products/${prod.slug}.webp`;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={mainImage}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/products/default.webp";
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          {prod.category_name || prod.category?.name || "Sin categoría"}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {prod.brand_name || prod.brand?.name || "Sin marca"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(
                            prod.is_on_sale && prod.sale_price
                              ? prod.sale_price
                              : prod.base_price
                          )}
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
                            (typeof totalStock === "number" && totalStock <= 5) ||
                            totalStock === "Agotado"
                              ? "text-red-500 font-bold"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {typeof totalStock === "number"
                            ? `${totalStock} un.`
                            : totalStock}
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Editar / Modificar producto"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Desactivar producto"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div>
                <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {modalMode === "edit" ? "Modificar Producto" : "Nuevo Producto"}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {modalMode === "edit"
                    ? `Actualizando: ${formName || "Producto seleccionado"}`
                    : "Completá los campos para sumar un producto al catálogo."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
              {/* Nombre */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Máquina Cortadora Wahl Legend"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Breve detalle de características, modo de uso o especificaciones..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Categoría y Marca */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
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

              {/* Precios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Base (ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
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
                    disabled={!formIsOnSale}
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="7999.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Toggles: Oferta, Destacado y Activo */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOnSale}
                    onChange={(e) => setFormIsOnSale(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>En Oferta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Producto Destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Producto Activo
                  </span>
                </label>
              </div>

              {/* Inventario / Stock */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  {modalMode === "edit" ? "Control de Stock" : "Inventario Inicial"}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === "edit"}
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="WAHL-001"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                      Variante
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === "edit"}
                      value={formVariantName}
                      onChange={(e) => setFormVariantName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                      Stock (unidades) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE IMÁGENES CON PREVISUALIZACIÓN */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Galería de Fotos del Producto
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formImages.length}{" "}
                    {formImages.length === 1 ? "foto cargada" : "fotos cargadas"}
                  </span>
                </div>

                {/* Galería de Previsualización */}
                {(formImages.length > 0 || uploadingPreview) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                    {formImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 aspect-square flex items-center justify-center shadow-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                          onError={(e) => {
                            e.currentTarget.src = "/products/default.webp";
                          }}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-sm z-10">
                            Portada
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-zinc-950/80 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-sm z-10"
                          title="Eliminar esta foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Previsualización instantánea mientras se sube */}
                    {uploadingPreview && (
                      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-amber-500/80 bg-amber-500/10 aspect-square flex flex-col items-center justify-center text-center p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadingPreview}
                          alt="Subiendo..."
                          className="absolute inset-0 w-full h-full object-cover opacity-25"
                        />
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500 relative z-10 mb-1" />
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 relative z-10">
                          Subiendo...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dropzone de subida de archivo */}
                <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-3.5 text-center cursor-pointer transition-colors flex items-center justify-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                    {isUploading
                      ? "Subiendo archivo a Supabase Storage..."
                      : "Elegir archivo para subir a Storage"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {/* Input secundario: URL externa o directa */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="O pegar URL directa de imagen (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!urlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold transition-colors disabled:opacity-40 cursor-pointer text-xs"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {modalMode === "edit"
                      ? "Actualizar Producto"
                      : "Guardar Producto"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
