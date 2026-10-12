"use client";

import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function CouponsTable({
  coupons = [],
  search = "",
  onSearchChange,
  isLoading,
  isError,
  error,
  onToggleStatus,
  isToggling,
  onDeleteClick,
  onOpenCreate,
}) {
  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Conteo */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#de1b76] focus:ring-2 focus:ring-[#de1b76]/20 transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {filteredCoupons.length}{" "}
          {filteredCoupons.length === 1 ? "cupón encontrado" : "cupones encontrados"}
        </div>
      </div>

      {/* Contenedor de la Tabla */}
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
              onClick={onOpenCreate}
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
                          onClick={() => onToggleStatus(coupon)}
                          disabled={isToggling}
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
                          onClick={() => onDeleteClick(coupon.id)}
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
    </div>
  );
}
