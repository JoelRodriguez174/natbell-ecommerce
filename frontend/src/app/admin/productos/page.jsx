"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";
import ProductsTable from "../../../components/admin/products/ProductsTable";
import ProductFormModal from "../../../components/admin/products/ProductFormModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminProductosPage() {
  const router = useRouter();
  const { token } = useAdminAuthStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const isFirstMount = useRef(true);

  // Modal State
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

  const fetchCatalogData = useCallback(async (searchQuery = "") => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(
          `${API_URL}/api/products?per_page=50${
            searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
          }&_t=${timestamp}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          }
        ),
        fetch(`${API_URL}/api/categories?_t=${timestamp}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(`${API_URL}/api/brands?_t=${timestamp}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.items || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData || []);
      }
      if (brandRes.ok) {
        const bData = await brandRes.json();
        setBrands(bData || []);
      }
    } catch {
      setFeedback({ type: "error", message: "Error al conectar con el servidor." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchCatalogData();
      return;
    }

    const timer = setTimeout(() => {
      fetchCatalogData(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, fetchCatalogData]);

  // Filtrado instantáneo en cliente por nombre, SKU, marca o categoría
  const visibleProducts = useMemo(() => {
    if (!search || !search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const sku = String(p.variants?.[0]?.sku || p.sku || "").toLowerCase();
      const brand = (p.brand_name || "").toLowerCase();
      const cat = (p.category_name || "").toLowerCase();
      return (
        name.includes(q) ||
        sku.includes(q) ||
        brand.includes(q) ||
        cat.includes(q)
      );
    });
  }, [products, search]);


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
      prod.stock ??
      prod.total_stock ??
      prod.variants?.[0]?.stock ??
      (typeof prod.stock === "number" ? prod.stock : 0);
    setFormStock(initialStock);

    if (prod.variants?.[0]?.id) {
      setEditingVariantId(prod.variants[0].id);
      setFormSku(prod.variants[0].sku || "");
      setFormVariantName(prod.variants[0].variant_name || "Estándar");
    }

    setIsModalOpen(true);

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

  // Subida de imagen
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

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

  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;
    setFormImages((prev) => [...prev, clean]);
    setUrlInput("");
  };

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
      await fetchCatalogData(search);
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!token) return;
    const confirm = window.confirm(
      `¿Estás seguro de eliminar '${prod.name}'? Esta acción no se puede deshacer.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${prod.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al eliminar producto");

      // Actualización optimista inmediata en la UI
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));

      setFeedback({
        type: "success",
        message: `Producto '${prod.name}' eliminado.`,
      });
      await fetchCatalogData(search);
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Botón Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Administrá el stock, precios, variantes y fotos del catálogo oficial de Natbell.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, SKU, marca o categoría..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Tabla de Productos con Ordenamiento y Filtros */}
      <ProductsTable
        products={visibleProducts}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProduct}
      />

      {/* Modal Crear / Editar */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        onSubmit={handleSubmitProduct}
        isSubmitting={isSubmitting}
        categories={categories}
        brands={brands}
        formName={formName}
        setFormName={setFormName}
        formDesc={formDesc}
        setFormDesc={setFormDesc}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formBrand={formBrand}
        setFormBrand={setFormBrand}
        formPrice={formPrice}
        setFormPrice={setFormPrice}
        formSalePrice={formSalePrice}
        setFormSalePrice={setFormSalePrice}
        formIsOnSale={formIsOnSale}
        setFormIsOnSale={setFormIsOnSale}
        formIsFeatured={formIsFeatured}
        setFormIsFeatured={setFormIsFeatured}
        formIsActive={formIsActive}
        setFormIsActive={setFormIsActive}
        formStock={formStock}
        setFormStock={setFormStock}
        formSku={formSku}
        setFormSku={setFormSku}
        formVariantName={formVariantName}
        setFormVariantName={setFormVariantName}
        formImages={formImages}
        onRemoveImage={handleRemoveImage}
        onAddImageUrl={handleAddImageUrl}
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        uploadingPreview={uploadingPreview}
      />
    </div>
  );
}
