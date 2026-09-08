"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Package,
  Clock,
  Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await apiFetch("/api/admin/dashboard/stats", {
          headers: adminAuth.getAuthHeaders(),
        });
        setStats(data);
      } catch (e) {
        console.error("Error loading dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadgeClass = (st) => {
    switch (st) {
      case "paid":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "shipped":
        return "bg-blue-950/80 text-blue-400 border-blue-800";
      case "delivered":
        return "bg-purple-950/80 text-purple-400 border-purple-800";
      case "cancelled":
        return "bg-red-950/80 text-red-400 border-red-800";
      default:
        return "bg-amber-950/80 text-amber-400 border-amber-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Dashboard General
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Métricas clave, volumen de ventas y pedidos pendientes de despacho.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ventas Hoy */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ventas Hoy
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-28 bg-slate-800 rounded-md" />
            ) : (
              <span className="text-2xl font-black text-white">
                {formatPrice(stats?.sales_today)}
              </span>
            )}
          </div>
        </div>

        {/* Ventas Este Mes */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ventas Mes
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-28 bg-slate-800 rounded-md" />
            ) : (
              <span className="text-2xl font-black text-white">
                {formatPrice(stats?.sales_this_month)}
              </span>
            )}
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Pedidos Pendientes
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16 bg-slate-800 rounded-md" />
            ) : (
              <span className="text-2xl font-black text-white">
                {stats?.pending_orders_count || 0}
              </span>
            )}
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Bajo Stock (&lt;5u)
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16 bg-slate-800 rounded-md" />
            ) : (
              <span className="text-2xl font-black text-white">
                {stats?.low_stock_variants_count || 0}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Pedidos Recientes</h2>
          <Link
            href="/admin/pedidos"
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>Ver todos los pedidos</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">Orden #</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Total</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Cargando pedidos recientes...
                  </td>
                </tr>
              ) : !stats?.recent_orders || stats.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay pedidos registrados aún.
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {ord.customer_name}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadgeClass(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/pedidos/${ord.id}`}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Detalle →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
