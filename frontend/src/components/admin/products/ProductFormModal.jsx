"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import ProductImageManager from "./ProductImageManager";

export default function ProductFormModal({
  isOpen,
  onClose,
  modalMode,
  initialData,
  onSubmit,
  isSubmitting,
  categories,
  brands,
  onFileUpload,
  isUploading,
  uploadingPreview,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      brand_id: "",
      base_price: "",
      sale_price: "",
      is_on_sale: false,
      is_featured: false,
      is_active: true,
      stock: 10,
      variant_name: "Estándar",
      sku: "",
      images: [],
    },
  });

  const formImages = watch("images");
  const formIsOnSale = watch("is_on_sale");

  useEffect(() => {
    if (isOpen) {
      if (modalMode === "edit" && initialData) {
        const p = initialData;
        const initialImgs =
          p.image_urls && p.image_urls.length > 0
            ? [...p.image_urls]
            : p.images && p.images.length > 0
            ? [...p.images]
            : [];
            
        const matchedCategory = categories.find(
          (c) =>
            c.id === p.category_id ||
            c.name === p.category_name ||
            c.slug === p.category_slug
        );
        const matchedBrand = brands.find(
          (b) =>
            b.id === p.brand_id ||
            b.name === p.brand_name ||
            b.slug === p.brand_slug
        );

        const initialStock =
          p.stock ??
          p.total_stock ??
          p.variants?.[0]?.stock ??
          (typeof p.stock === "number" ? p.stock : 0);

        reset({
          name: p.name || "",
          description: p.description || "",
          category_id: matchedCategory?.id || p.category_id || categories[0]?.id || "",
          brand_id: matchedBrand?.id || p.brand_id || brands[0]?.id || "",
          base_price: p.base_price !== undefined ? String(p.base_price) : "",
          sale_price:
            p.sale_price !== undefined && p.sale_price !== null
              ? String(p.sale_price)
              : "",
          is_on_sale: Boolean(p.is_on_sale),
          is_featured: Boolean(p.is_featured),
          is_active: p.is_active !== false,
          stock: initialStock,
          variant_name: p.variants?.[0]?.variant_name || "Estándar",
          sku: p.variants?.[0]?.sku || p.sku || "",
          images: initialImgs,
        });
      } else {
        reset({
          name: "",
          description: "",
          category_id: categories[0]?.id || "",
          brand_id: brands[0]?.id || "",
          base_price: "",
          sale_price: "",
          is_on_sale: false,
          is_featured: false,
          is_active: true,
          stock: 10,
          variant_name: "Estándar",
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          images: [],
        });
      }
    }
  }, [isOpen, modalMode, initialData, categories, brands, reset]);

  const handleRemoveImage = (indexToRemove) => {
    setValue("images", formImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddImageUrl = (url) => {
    if (!url) return;
    setValue("images", [...formImages, url]);
  };
  
  // Intercept onFileUpload to auto-append the URL
  const handleFileUploadInternal = async (e) => {
    if (!onFileUpload) return;
    const url = await onFileUpload(e);
    if (url) {
      setValue("images", [...formImages, url]);
    }
  };

  if (!isOpen) return null;
  const isEdit = modalMode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div>
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
              {isEdit ? "Modificar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEdit
                ? `Actualizando producto en el catálogo`
                : "Completá los campos para sumar un producto al catálogo."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                {...register("name", { required: "El nombre es obligatorio" })}
                placeholder="Ej: Sérum Facial Vitamina C 30ml"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
              {errors.name && <span className="text-red-500 text-[10px] mt-1">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Descripción detallada
              </label>
              <textarea
                rows={3}
                {...register("description")}
                placeholder="Beneficios, modo de uso, textura, ingredientes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Categoría *
              </label>
              <select
                {...register("category_id", { required: "Categoría es requerida" })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Marca *
              </label>
              <select
                {...register("brand_id", { required: "Marca es requerida" })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Precio Base (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("base_price", { required: "Precio es requerido" })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Precio de Oferta (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!formIsOnSale}
                  {...register("sale_price")}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono font-bold disabled:opacity-40"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_on_sale")}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  En Oferta / Descuento
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_featured")}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Producto Destacado
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_active")}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Activo para la venta
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Stock Disponible *
              </label>
              <input
                type="number"
                min="0"
                {...register("stock", { required: "Stock es requerido" })}
                placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre de la Variante
              </label>
              <input
                type="text"
                {...register("variant_name")}
                placeholder="Ej: 50ml, Tono 01, etc."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Código SKU
              </label>
              <input
                type="text"
                {...register("sku")}
                placeholder="SKU-123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <ProductImageManager
            images={formImages}
            onRemoveImage={handleRemoveImage}
            onAddImageUrl={handleAddImageUrl}
            onFileUpload={handleFileUploadInternal}
            isUploading={isUploading}
            uploadingPreview={uploadingPreview}
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? "Actualizar Producto" : "Guardar Producto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
