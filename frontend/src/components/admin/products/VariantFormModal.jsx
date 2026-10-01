"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";

export default function VariantFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  parentProduct,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Reset form with default values when modal opens
  useEffect(() => {
    if (isOpen && parentProduct) {
      const baseSku = parentProduct.variants?.[0]?.sku || parentProduct.sku;
      const prefix = baseSku ? baseSku.split("-")[0] : "SKU";
      reset({
        variant_name: "",
        sku: `${prefix}-${Date.now().toString().slice(-6)}`,
        stock: 10,
        price_override: "",
      });
    }
  }, [isOpen, parentProduct, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div>
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
              Añadir Variante
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
              Producto: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{parentProduct?.name}</span>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre de la Variante *
            </label>
            <input
              type="text"
              {...register("variant_name", { required: "El nombre es requerido" })}
              placeholder="Ej: 50ml, Tono 01, Rojo..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            {errors.variant_name && <span className="text-red-500 text-[10px] mt-1">{errors.variant_name.message}</span>}
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Código SKU *
            </label>
            <input
              type="text"
              {...register("sku", { required: "El SKU es requerido" })}
              placeholder="SKU-123456"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
            {errors.sku && <span className="text-red-500 text-[10px] mt-1">{errors.sku.message}</span>}
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Stock Inicial *
            </label>
            <input
              type="number"
              min="0"
              {...register("stock", { required: "El stock es requerido", min: 0 })}
              placeholder="10"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
            />
            {errors.stock && <span className="text-red-500 text-[10px] mt-1">{errors.stock.message}</span>}
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Precio Especial (Opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("price_override")}
              placeholder="Dejar vacío para heredar del producto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Si esta variante cuesta diferente al precio base, ingrésalo aquí.
            </p>
          </div>

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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Guardar Variante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
