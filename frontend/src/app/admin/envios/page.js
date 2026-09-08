"use client";

import React, { useState, useEffect } from "react";
import { Truck, Plus, Edit2, Save, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminShippingZonesPage() {
  const { addToast } = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // New zone form
  const [newZone, setNewZone] = useState({
    zone_name: "",
    from_cp: "",
    to_cp: "",
    cost: "",
    estimated_days: "3",
  });
  const [creating, setCreating] = useState(false);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/shipping-zones", {
        headers: adminAuth.getAuthHeaders(),
      });
      setZones(data || []);
    } catch (e) {
      console.error("Error loading shipping zones:", e);
      addToast("Error al cargar zonas de envío", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleUpdateCost = async (zoneId, newCost) => {
    try {
      await apiFetch(`/api/admin/shipping-zones/${zoneId}`, {
        method: "PUT",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({ cost: parseFloat(newCost) }),
      });
      addToast("Tarifa actualizada con éxito", "success");
      loadZones();
    } catch (e) {
      addToast("Error al actualizar tarifa", "error");
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZone.zone_name.trim() || !newZone.cost) {
      addToast("Completa los datos requeridos", "error");
      return;
    }
    setCreating(true);
    try {
      const ranges =
        newZone.from_cp && newZone.to_cp
          ? [{ from: newZone.from_cp.trim(), to: newZone.to_cp.trim() }]
          : [{ from: "1000", to: "9999" }];

      await apiFetch("/api/admin/shipping-zones", {
        method: "POST",
        headers: adminAuth.getAuthHeaders(),
        body: JSON.stringify({
          zone_name: newZone.zone_name.trim(),
          postal_code_ranges: ranges,
          cost: parseFloat(newZone.cost),
          estimated_days: parseInt(newZone.estimated_days || "3", 10),
          is_active: true,
        }),
      });

      addToast("Zona de envío creada con éxito", "success");
      setNewZone({
        zone_name: "",
        from_cp: "",
        to_cp: "",
        cost: "",
        estimated_days: "3",
      });
      loadZones();
    } catch (e) {
      addToast(e.message || "Error al crear zona", "error");
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Zonas y Tarifas de Envío
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configuración de costos de logística fija por rangos de código postal.
        </p>
      </div>

      {/* Existing zones table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-rose-400" />
            <h3 className="font-bold text-white text-sm">Zonas Activas</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Zona</th>
                <th className="py-3 px-4">Rangos CP</th>
                <th className="py-3 px-4">Tiempo Estimado</th>
                <th className="py-3 px-4">Costo Fijo ($)</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Cargando zonas de envío...
                  </td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay zonas configuradas.
                  </td>
                </tr>
              ) : (
                zones.map((z) => (
                  <tr key={z.id}>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {z.zone_name}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {JSON.stringify(z.postal_code_ranges)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {z.estimated_days} días hábiles
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          defaultValue={z.cost}
                          onBlur={(e) => handleUpdateCost(z.id, e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold text-xs"
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          z.is_active
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {z.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Zone */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-white text-sm">
          + Agregar Nueva Zona de Envío
        </h3>

        <form onSubmit={handleCreateZone} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre de Zona"
              placeholder="Ej: Patagonia / Cuyo"
              required
              value={newZone.zone_name}
              onChange={(e) =>
                setNewZone({ ...newZone, zone_name: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Costo Fijo de Envío ($)"
              type="number"
              step="0.01"
              required
              placeholder="Ej: 8500"
              value={newZone.cost}
              onChange={(e) =>
                setNewZone({ ...newZone, cost: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Desde Código Postal"
              placeholder="Ej: 8000"
              value={newZone.from_cp}
              onChange={(e) =>
                setNewZone({ ...newZone, from_cp: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />

            <Input
              label="Hasta Código Postal"
              placeholder="Ej: 9400"
              value={newZone.to_cp}
              onChange={(e) =>
                setNewZone({ ...newZone, to_cp: e.target.value })
              }
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={creating}
            >
              <Plus size={16} />
              <span>Guardar Zona</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
