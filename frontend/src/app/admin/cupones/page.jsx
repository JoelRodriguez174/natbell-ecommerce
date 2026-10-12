"use client";

import { useState } from "react";
import { Ticket, Plus } from "lucide-react";
import { useAdminCoupons, useAdminCouponMutations } from "../../../hooks/admin/useAdminCoupons";
import CouponKpis from "../../../components/admin/coupons/CouponKpis";
import CouponsTable from "../../../components/admin/coupons/CouponsTable";
import CouponCreateModal from "../../../components/admin/coupons/CouponCreateModal";
import CouponDeleteModal from "../../../components/admin/coupons/CouponDeleteModal";

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading, isError, error } = useAdminCoupons();
  const { createCoupon, toggleCoupon, deleteCoupon } = useAdminCouponMutations();

  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Estadísticas KPI
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.is_active).length;
  const totalTimesUsed = coupons.reduce((acc, c) => acc + (Number(c.times_used) || 0), 0);

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

  const handleCreateCoupon = async (payload) => {
    await createCoupon.mutateAsync(payload);
    setIsCreateModalOpen(false);
  };

  const handleDeleteCoupon = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCoupon.mutateAsync(deleteConfirmId);
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
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#de1b76] hover:bg-[#c21464] text-white text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cupón</span>
        </button>
      </div>

      {/* KPI Cards */}
      <CouponKpis
        totalCoupons={totalCoupons}
        activeCoupons={activeCoupons}
        totalTimesUsed={totalTimesUsed}
      />

      {/* Tabla con Filtro de Búsqueda */}
      <CouponsTable
        coupons={coupons}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onToggleStatus={handleToggle}
        isToggling={toggleCoupon.isPending}
        onDeleteClick={setDeleteConfirmId}
        onOpenCreate={() => setIsCreateModalOpen(true)}
      />

      {/* Modal de Creación */}
      <CouponCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCoupon}
        isSubmitting={createCoupon.isPending}
      />

      {/* Modal de Eliminación */}
      <CouponDeleteModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteCoupon}
        isDeleting={deleteCoupon.isPending}
      />
    </div>
  );
}
