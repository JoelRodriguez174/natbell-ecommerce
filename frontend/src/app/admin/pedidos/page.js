"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Filter } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminAuth } from "@/store/adminAuth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

export default function AdminOrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `&q=${encodeURIComponent(search.trim())}` : "";
      const st = statusFilter ? `&status=${statusFilter}` : "";
      const data = await apiFetch(`/api/admin/orders?page=${page}&per_page=20${q}${st}`, {
        headers: adminAuth.getAuthHeaders(),
      });
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading orders:", e);
      addToast("Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

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
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
      case "shipped":
        return "bg-blue-950 text-blue-400 border-blue-800";
      case "delivered":
        return "bg-purple-950 text-purple-400 border-purple-800";
      case "cancelled":
        return "bg-red-950 text-red-400 border-red-800";
      default:
        return "bg-amber-950 text-amber-400 border-amber-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Gestión de Pedidos
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Control de despachos, pagos y entregas a clientes ({total} pedidos).
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl"
        >
          <Search size={18} className="text-slate-500 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Buscar por # de orden, cliente o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl">
          <Filter size={14} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-xs font-semibold text-slate-300 outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">Todos los estados</option>
            <option value="pending" className="bg-slate-900">Pendiente</option>
            <option value="paid" className="bg-slate-900">Pagado / Aprobado</option>
            <option value="shipped" className="bg-slate-900">En Despacho</option>
            <option value="delivered" className="bg-slate-900">Entregado</option>
            <option value="cancelled" className="bg-slate-900">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Orden</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Destino</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay pedidos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {ord.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">
                        {ord.customer_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {ord.customer_email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{ord.shipping_city}, {ord.shipping_province}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        CP: {ord.shipping_postal_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatPrice(ord.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/pedidos/${ord.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Eye size={14} />
                        <span>Ver</span>
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
