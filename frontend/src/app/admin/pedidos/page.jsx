"use client";

import { useState } from "react";
import OrderFilterTabs from "../../../components/admin/orders/OrderFilterTabs";
import OrdersTable from "../../../components/admin/orders/OrdersTable";
import OrderStatusModal from "../../../components/admin/orders/OrderStatusModal";
import { useOrders, useOrderMutations } from "../../../hooks/admin/useAdminOrders";

export default function AdminPedidosPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useOrders({ status: selectedStatus, search });
  const { updateStatus, generateAndreaniShipment } = useOrderMutations();

  // Modal para actualizar estado
  const [selectedOrder, setSelectedOrder] = useState(null);
  const handleOpenStatusModal = (ord) => {
    setSelectedOrder(ord);
  };

  const handleGenerateAndreaniShipment = async () => {
    if (!selectedOrder) return;
    try {
      const res = await generateAndreaniShipment.mutateAsync(selectedOrder.order_number);
      // Actualizamos el modal local para no tener que cerrarlo
      // El invalidateQueries actualizará la tabla
      setSelectedOrder((prev) => ({ 
        ...prev, 
        status: "shipped",
        tracking_number: res.tracking_number 
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (data) => {
    if (!selectedOrder) return;

    try {
      await updateStatus.mutateAsync({
        orderId: selectedOrder.order_number,
        payload: {
          status: data.status,
          tracking_number: data.tracking_number || null,
        },
      });
      setSelectedOrder(null);
    } catch (err) {
      alert(err.message);
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
        isUpdating={updateStatus.isPending}
        isGeneratingAndreani={generateAndreaniShipment.isPending}
        onGenerateAndreaniShipment={handleGenerateAndreaniShipment}
        onSubmit={handleUpdateStatus}
      />
    </div>
  );
}
