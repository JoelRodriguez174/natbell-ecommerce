import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";

export default function ShippingZoneModal({ editingZone, onClose, isUpdating, onSubmit }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      cost: "",
      estimated_days: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingZone) {
      reset({
        cost: editingZone.cost?.toString() || "",
        estimated_days: editingZone.estimated_days?.toString() || "",
        is_active: editingZone.is_active !== false,
      });
    }
  }, [editingZone, reset]);

  if (!editingZone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Editar Tarifa: {editingZone.zone_name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Costo de Envío (ARS) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min={0}
              {...register("cost")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Plazo de Entrega Estimado (Días hábiles) *
            </label>
            <input
              type="number"
              required
              min={1}
              {...register("estimated_days")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                {...register("is_active")}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Zona Activa y Disponible en Cotizador</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Guardar Tarifa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
