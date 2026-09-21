"use client";

import { X, Loader2 } from "lucide-react";
import ProductImageManager from "./ProductImageManager";

export default function ProductFormModal({
  isOpen,
  onClose,
  modalMode,
  onSubmit,
  isSubmitting,
  categories,
  brands,
  formName,
  setFormName,
  formDesc,
  setFormDesc,
  formCategory,
  setFormCategory,
  formBrand,
  setFormBrand,
  formPrice,
  setFormPrice,
  formSalePrice,
  setFormSalePrice,
  formIsOnSale,
  setFormIsOnSale,
  formIsFeatured,
  setFormIsFeatured,
  formIsActive,
  setFormIsActive,
  formStock,
  setFormStock,
  formSku,
  setFormSku,
  formVariantName,
  setFormVariantName,
  formImages,
  onRemoveImage,
  onAddImageUrl,
  urlInput,
  onUrlInputChange,
  onFileUpload,
  isUploading,
  uploadingPreview,
}) {
  if (!isOpen) return null;

  const isEdit = modalMode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div>
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
              {isEdit ? "Modificar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEdit
                ? `Actualizando: ${formName || "Producto"}`
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

        {/* Formulario */}
        <form onSubmit={onSubmit} className="space-y-5 text-xs">
          {/* Nombre y Descripción */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Sérum Facial Vitamina C 30ml"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Descripción detallada
              </label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Beneficios, modo de uso, textura, ingredientes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Categoría y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
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
                required
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Precios y Ofertas */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Precio Base (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
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
                  value={formSalePrice}
                  onChange={(e) => setFormSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono font-bold disabled:opacity-40"
                />
              </div>
            </div>

            {/* Checkboxes de Estado Comercial */}
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsOnSale}
                  onChange={(e) => setFormIsOnSale(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  En Oferta / Descuento
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Producto Destacado
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Activo para la venta
                </span>
              </label>
            </div>
          </div>

          {/* Inventario y Variantes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Stock Disponible *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
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
                value={formVariantName}
                onChange={(e) => setFormVariantName(e.target.value)}
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
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="SKU-123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Galería de Imágenes */}
          <ProductImageManager
            images={formImages}
            onRemoveImage={onRemoveImage}
            onAddImageUrl={onAddImageUrl}
            urlInput={urlInput}
            onUrlInputChange={onUrlInputChange}
            onFileUpload={onFileUpload}
            isUploading={isUploading}
            uploadingPreview={uploadingPreview}
          />

          {/* Botones de Acción */}
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
