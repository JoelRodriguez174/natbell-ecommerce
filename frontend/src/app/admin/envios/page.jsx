"use client";

import { useState } from "react";
import { Truck, Edit, CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { useShippingZones, useShippingMutations } from "../../../hooks/admin/useAdminShipping";
import ShippingZoneModal from "../../../components/admin/shipping/ShippingZoneModal";

export default function AdminEnviosPage() {
  const { data: zones = [], isLoading } = useShippingZones();
  const { updateZone } = useShippingMutations();

  const [feedback, setFeedback] = useState(null);
  const [editingZone, setEditingZone] = useState(null);

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setFeedback(null);
  };

  const handleSaveZone = async (data) => {
    if (!editingZone) return;

    setFeedback(null);
    try {
      await updateZone.mutateAsync({
        zoneId: editingZone.id,
        payload: {
          cost: parseFloat(data.cost),
          estimated_days: parseInt(data.estimated_days, 10),
          is_active: data.is_active,
        },
      });

      setFeedback({ type: "success", message: `Tarifa de '${editingZone.zone_name}' actualizada.` });
      setEditingZone(null);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Tarifas de Envío
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Configurá los costos logísticos y plazos de entrega por zona geográfica y rangos de código postal.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${feedback.type === "success"
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

      {/* Zones Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Zona de Entrega</th>
                <th className="py-3.5 px-4 font-bold">Códigos Postales Abarcados</th>
                <th className="py-3.5 px-4 font-bold">Costo Actual</th>
                <th className="py-3.5 px-4 font-bold">Plazo Estimado</th>
                <th className="py-3.5 px-4 font-bold">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Cargando zonas de envío...</span>
                  </td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No hay zonas de envío configuradas en la base de datos.
                  </td>
                </tr>
              ) : (
                zones.map((zone) => {
                  const rangesText = (zone.postal_code_ranges || [])
                    .map((r) => `${r.from} - ${r.to}`)
                    .join(", ");

                  return (
                    <tr key={zone.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {zone.zone_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px] block max-w-xs truncate">
                          {rangesText || "Todos"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(zone.cost)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{zone.estimated_days} días hábiles</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${zone.is_active !== false
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                            }`}
                        >
                          {zone.is_active !== false ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(zone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
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

      {/* Modal: Editar Tarifa */}
      <ShippingZoneModal
        editingZone={editingZone}
        onClose={() => setEditingZone(null)}
        isUpdating={updateZone.isPending}
        onSubmit={handleSaveZone}
      />
    </div>
  );
}
