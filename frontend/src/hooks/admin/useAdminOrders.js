import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Queries ---

export function useOrders({ status, search } = {}) {
  const { token } = useAdminAuthStore();

  return useQuery({
    queryKey: ["admin_orders", { status, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.append("status", status);
      if (search) params.append("search", search);

      const res = await fetch(`${API_URL}/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener pedidos");
      const data = await res.json();
      return data.items || [];
    },
    enabled: !!token,
  });
}

// --- Mutations ---

export function useOrderMutations() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuthStore();

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, payload }) => {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al actualizar el estado del pedido");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    },
  });

  const generateAndreaniShipment = useMutation({
    mutationFn: async (orderId) => {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/generate-andreani-shipment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al generar envío de Andreani");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    },
  });

  return {
    updateStatus,
    generateAndreaniShipment,
  };
}
