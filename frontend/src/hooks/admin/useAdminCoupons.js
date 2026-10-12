import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export function useAdminCoupons() {
  const { token } = useAdminAuthStore();

  return useQuery({
    queryKey: ["admin_coupons"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Error al obtener la lista de cupones");
      }
      return (await res.json()) || [];
    },
    enabled: !!token,
  });
}

export function useAdminCouponMutations() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuthStore();

  const createCoupon = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Error al crear el cupón");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coupons"] });
    },
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ couponId, isActive }) => {
      const res = await fetch(
        `${API_URL}/api/admin/coupons/${couponId}/toggle?is_active=${isActive}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Error al cambiar estado del cupón");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coupons"] });
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: async (couponId) => {
      const res = await fetch(`${API_URL}/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Error al eliminar el cupón");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coupons"] });
    },
  });

  return {
    createCoupon,
    toggleCoupon,
    deleteCoupon,
  };
}
