"use client";

import { useState } from "react";
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Percent,
  Minus,
} from "lucide-react";
import { useAdminCoupons, useAdminCouponMutations } from "../../../hooks/admin/useAdminCoupons";

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading, isError, error } = useAdminCoupons();
  const { createCoupon, toggleCoupon, deleteCoupon } = useAdminCouponMutations();

  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Estado del formulario de creación
  const [formCode, setFormCode] = useState("");
  const [formPercent, setFormPercent] = useState(10);
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formError, setFormError] = useState("");

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  // Estadísticas KPI
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.is_active).length;
  const totalTimesUsed = coupons.reduce((acc, c) => acc + (Number(c.times_used) || 0), 0);

  const handleOpenCreateModal = () => {
    setFormCode("");
    setFormPercent(10);
    setFormMaxUses("");
    setFormExpiresAt("");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handlePercentDecrement = () => {
    setFormPercent((prev) => Math.max(1, prev - 1));
  };

  const handlePercentIncrement = () => {
    setFormPercent((prev) => Math.min(100, prev + 1));
  };

  const handlePercentChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setFormPercent(1);
    } else {
      setFormPercent(Math.min(100, Math.max(1, num)));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError("El código de cupón es obligatorio.");
      return;
    }

    if (formPercent < 1 || formPercent > 100) {
      setFormError("El porcentaje debe estar entre 1% y 100%.");
      return;
    }

    setFormError("");

    try {
      await createCoupon.mutateAsync({
        code: cleanCode,
        discount_percent: formPercent,
        is_active: true,
        max_uses: formMaxUses ? parseInt(formMaxUses, 10) : null,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      });
      setIsCreateModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Error al crear el cupón.");
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await toggleCoupon.mutateAsync({
        couponId: coupon.id,
        isActive: !coupon.is_active,
      });
    } catch (err) {
      alert(err.message || "Error al actualizar estado");
    }
  };

  const handleDelete = async (couponId) => {
    try {
      await deleteCoupon.mutateAsync(couponId);
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message || "Error al eliminar el cupón");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#de1b76]" />
            <span>Gestión de Cupones</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Creá, activá o eliminá códigos de descuento porcentuales para tus clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#de1b76] hover:bg-[#c21464] text-white text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cupón</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Cupones</span>
            <Ticket className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="mt-3 text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {totalCoupons}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Cupones Activos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCoupons}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Usos Canjeados</span>
            <Users className="w-4 h-4 text-[#de1b76]" />
          </div>
          <p className="mt-3 text-3xl font-black text-[#de1b76]">
            {totalTimesUsed}
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20 transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {filteredCoupons.length} {filteredCoupons.length === 1 ? "cupón encontrado" : "cupones encontrados"}
        </div>
      </div>

      {/* Tabla de Cupones */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#de1b76]" />
            <p className="text-sm font-medium">Cargando cupones...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-semibold">Error al cargar cupones</p>
            <p className="text-xs text-zinc-400">{error?.message}</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 space-y-3">
            <Ticket className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No hay cupones creados
            </p>
            <p className="text-xs max-w-sm mx-auto text-zinc-500">
              Comenzá creando tu primer código de descuento para promociones, ofertas de temporada o fidelización.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear mi primer cupón</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/40 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Descuento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Usos Realizados</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredCoupons.map((coupon) => {
                  const isExpired =
                    coupon.expires_at && new Date(coupon.expires_at) < new Date();
                  const isExhausted =
                    coupon.max_uses && coupon.times_used >= coupon.max_uses;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs tracking-wider px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                          {coupon.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span>{coupon.discount_percent}% OFF</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(coupon)}
                          disabled={toggleCoupon.isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            coupon.is_active
                              ? "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200"
                          }`}
                          title="Hacé click para cambiar el estado"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              coupon.is_active ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                          />
                          <span>{coupon.is_active ? "Activo" : "Inactivo"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {coupon.times_used}
                          </span>
                          <span className="text-zinc-400">
                            / {coupon.max_uses ? `${coupon.max_uses} máx` : "ilimitado"}
                          </span>
                        </div>
                        {isExhausted && (
                          <span className="text-[10px] text-amber-600 font-semibold block">
                            Cupo agotado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {coupon.expires_at ? (
                          <div>
                            <span>
                              {new Date(coupon.expires_at).toLocaleDateString("es-AR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {isExpired && (
                              <span className="text-[10px] text-red-500 font-semibold block">
                                Expirado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Sin límite</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(coupon.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Eliminar cupón"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#de1b76]" />
                <span>Crear Nuevo Cupón</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Código de Cupón *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="EJ: VERANO20"
                  required
                  className="w-full px-3.5 py-2 font-mono uppercase tracking-wider text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Se convertirá automáticamente a mayúsculas sin espacios.
                </p>
              </div>

              {/* Porcentaje con Stepper */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Porcentaje de Descuento *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePercentDecrement}
                    disabled={formPercent <= 1}
                    className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                    title="Bajar 1%"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      required
                      className="w-full text-center py-2 px-3 text-base font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm pointer-events-none">
                      %
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePercentIncrement}
                    disabled={formPercent >= 100}
                    className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                    title="Subir 1%"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Mínimo: 1%</span>
                  <span>Máximo: 100%</span>
                </div>
              </div>

              {/* Límite de usos */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Límite de Usos Totales (Opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  placeholder="Dejar vacío para ilimitado"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
                />
              </div>

              {/* Fecha de Expiración */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Fecha de Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{formError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCoupon.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#de1b76] hover:bg-[#c21464] text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {createCoupon.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Crear Cupón</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                ¿Eliminar cupón?
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Esta acción no se puede deshacer. Los clientes ya no podrán utilizar este código para obtener descuentos.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteCoupon.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteCoupon.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
