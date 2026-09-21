"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";
import OrderFilterTabs from "../../../components/admin/orders/OrderFilterTabs";
import OrdersTable from "../../../components/admin/orders/OrdersTable";
import OrderStatusModal from "../../../components/admin/orders/OrderStatusModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPedidosPage() {
  const { token } = useAdminAuthStore();

  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("paid");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal para actualizar estado
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("shipped");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingAndreani, setIsGeneratingAndreani] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append("status", selectedStatus);
      if (search) params.append("search", search);

      const res = await fetch(`${API_URL}/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || []);
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenStatusModal = (ord) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status === "paid" ? "shipped" : ord.status);
    setTrackingNumber(ord.tracking_number || "");
  };

  const handleGenerateAndreaniShipment = async () => {
    if (!token || !selectedOrder) return;
    setIsGeneratingAndreani(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/orders/${selectedOrder.order_number}/generate-andreani-shipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al generar código de seguimiento con Andreani");
      }

      setTrackingNumber(data.tracking_number || "");
      setNewStatus("shipped");
      setSelectedOrder((prev) => ({
        ...prev,
        status: "shipped",
        tracking_number: data.tracking_number,
      }));
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGeneratingAndreani(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!token || !selectedOrder) return;

    setIsUpdating(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/orders/${selectedOrder.order_number}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            tracking_number: trackingNumber || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Error al actualizar el estado de la orden");

      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Gestión de Pedidos
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Supervisá compras, coordiná despachos logísticos y gestioná códigos de seguimiento.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <OrderFilterTabs
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onManageOrder={handleOpenStatusModal}
      />

      {/* Modal: Cambiar Estado de Pedido */}
      <OrderStatusModal
        selectedOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        trackingNumber={trackingNumber}
        onTrackingNumberChange={setTrackingNumber}
        isUpdating={isUpdating}
        isGeneratingAndreani={isGeneratingAndreani}
        onGenerateAndreaniShipment={handleGenerateAndreaniShipment}
        onSubmit={handleUpdateStatus}
      />
    </div>
  );
}
