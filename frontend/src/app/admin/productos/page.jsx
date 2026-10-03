"use client";

import { useState } from "react";
import { Plus, Search, AlertCircle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";
import { useCatalogData, useProductMutations } from "../../../hooks/admin/useAdminCatalog";
import ProductsTable from "../../../components/admin/products/ProductsTable";
import ProductFormModal from "../../../components/admin/products/ProductFormModal";
import ProductImportModal from "../../../components/admin/products/ProductImportModal";
import VariantFormModal from "../../../components/admin/products/VariantFormModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminProductosPage() {
  const { token } = useAdminAuthStore();

  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState(null);

  // TanStack Query Hooks
  const { products, categories, brands, isLoading, refetchProducts } = useCatalogData(search);
  const { createProduct, updateProduct, deleteProduct, bulkDeleteProducts, createVariant } = useProductMutations();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"

  const [selectedProduct, setSelectedProduct] = useState(null); // Used for edit product or parent product for variant

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(null);

  // Abrir Modal Crear
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // Abrir Modal Editar
  const handleOpenEditModal = (prod) => {
    setModalMode("edit");
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  // Abrir Modal Añadir Variante
  const handleOpenVariantModal = (prod) => {
    setSelectedProduct(prod);
    setIsVariantModalOpen(true);
  };

  // Subida de imagen
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return null;

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
        throw new Error("Error al subir la imagen");
      }
      const data = await res.json();
      return data.url;
    } catch (err) {
      alert(err.message || "Error al subir imagen");
      return null;
    } finally {
      setIsUploading(false);
      setUploadingPreview(null);
      e.target.value = "";
    }
  };

  // Submit Product (Create or Update)
  const handleSubmitProduct = (data) => {
    setFeedback(null);
    const isEdit = modalMode === "edit";

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      category_id: data.category_id || null,
      brand_id: data.brand_id || null,
      base_price: parseFloat(data.base_price),
      sale_price: data.is_on_sale && data.sale_price ? parseFloat(data.sale_price) : null,
      is_on_sale: data.is_on_sale,
      is_featured: data.is_featured,
      is_active: data.is_active,
      images: data.images || [],
    };

    if (isEdit) {
      const variantId = selectedProduct?.variants?.[0]?.id;
      updateProduct.mutate(
        { productId: selectedProduct.id, payload, variantId, stock: data.stock },
        {
          onSuccess: () => {
            setFeedback({ type: "success", message: `¡Producto '${data.name}' actualizado exitosamente!` });
            setIsModalOpen(false);
          },
          onError: (err) => setFeedback({ type: "error", message: err.message }),
        }
      );
    } else {
      // Append initial variant for creation
      payload.variants = [
        {
          sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
          variant_name: data.variant_name || "Estándar",
          stock: parseInt(data.stock, 10) || 0,
        },
      ];

      createProduct.mutate(payload, {
        onSuccess: () => {
          setFeedback({ type: "success", message: `¡Producto '${data.name}' creado exitosamente!` });
          setIsModalOpen(false);
        },
        onError: (err) => setFeedback({ type: "error", message: err.message }),
      });
    }
  };

  // Submit Variant
  const handleSubmitVariant = (data) => {
    setFeedback(null);
    const payload = {
      sku: data.sku.trim(),
      variant_name: data.variant_name.trim(),
      price_override: data.price_override ? parseFloat(data.price_override) : null,
      stock: parseInt(data.stock, 10) || 0,
      is_active: true,
    };

    createVariant.mutate(
      { productId: selectedProduct.id, payload },
      {
        onSuccess: () => {
          setFeedback({ type: "success", message: `¡Variante añadida al producto!` });
          setIsVariantModalOpen(false);
        },
        onError: (err) => setFeedback({ type: "error", message: err.message }),
      }
    );
  };

  // Eliminar Producto
  const handleDeleteProduct = (prod) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar '${prod.name}'? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    deleteProduct.mutate(prod.id, {
      onSuccess: () => {
        setFeedback({ type: "success", message: `Producto '${prod.name}' eliminado.` });
      },
      onError: (err) => setFeedback({ type: "error", message: err.message }),
    });
  };

  const handleBulkDelete = async (selectedIds) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} productos? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    try {
      await bulkDeleteProducts.mutateAsync(Array.from(selectedIds));
      setFeedback({ type: "success", message: `Se han eliminado ${selectedIds.size} productos exitosamente.` });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Hubo un error al eliminar los productos seleccionados." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gestiona tu inventario, precios y variantes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all font-semibold flex items-center gap-2 text-xs shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Importar
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl transition-all font-bold flex items-center gap-2 text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Crear Producto
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
        />
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 animate-fadeIn ${feedback.type === "error"
              ? "bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50"
            }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <h3 className="text-sm font-bold">
              {feedback.type === "error" ? "Hubo un problema" : "Operación Exitosa"}
            </h3>
            <p className="text-xs mt-0.5 opacity-90">{feedback.message}</p>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ProductsTable
        products={products}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onAddVariant={handleOpenVariantModal}
        onDelete={handleDeleteProduct}
        onBulkDelete={handleBulkDelete}
      />

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        initialData={selectedProduct}
        categories={categories}
        brands={brands}
        onSubmit={handleSubmitProduct}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        uploadingPreview={uploadingPreview}
      />

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        token={token}
        onImportSuccess={() => {
          refetchProducts();
          setFeedback({ type: "success", message: "Importación completada y catálogo actualizado." });
        }}
      />

      <VariantFormModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        onSubmit={handleSubmitVariant}
        isSubmitting={createVariant.isPending}
        parentProduct={selectedProduct}
      />
    </div>
  );
}
