import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Queries ---

export function useShippingZones() {
  const { token } = useAdminAuthStore();

  return useQuery({
    queryKey: ["admin_shipping_zones"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/shipping/zones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener zonas de envío");
      const data = await res.json();
      return data || [];
    },
    enabled: !!token,
  });
}

// --- Mutations ---

export function useShippingMutations() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuthStore();

  const updateZone = useMutation({
    mutationFn: async ({ zoneId, payload }) => {
      const res = await fetch(`${API_URL}/api/admin/shipping/zones/${zoneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al actualizar la tarifa de envío");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_shipping_zones"] });
    },
  });

  return {
    updateZone,
  };
}
