"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";
import { formatCurrency } from "../../../lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminEnviosPage() {
  const { token } = useAdminAuthStore();

  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal para editar tarifa
  const [editingZone, setEditingZone] = useState(null);
  const [costInput, setCostInput] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchZones = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/shipping/zones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setZones(data || []);
      }
    } catch {
      setFeedback({ type: "error", message: "Error al cargar zonas de envío" });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setCostInput(zone.cost?.toString() || "");
    setDaysInput(zone.estimated_days?.toString() || "");
    setIsActiveInput(zone.is_active !== false);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!token || !editingZone) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/shipping/zones/${editingZone.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cost: parseFloat(costInput),
          estimated_days: parseInt(daysInput, 10),
          is_active: isActiveInput,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar la tarifa");

      setFeedback({ type: "success", message: `Tarifa de '${editingZone.zone_name}' actualizada.` });
      setEditingZone(null);
      fetchZones();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSaving(false);
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
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Editar Tarifa: {editingZone.zone_name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingZone(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Costo de Envío (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
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
                  value={daysInput}
                  onChange={(e) => setDaysInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isActiveInput}
                    onChange={(e) => setIsActiveInput(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Zona Activa y Disponible en Cotizador</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Tarifa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
