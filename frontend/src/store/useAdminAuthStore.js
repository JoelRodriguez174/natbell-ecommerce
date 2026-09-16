import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      adminUser: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/admin/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData.detail || "Error de autenticación. Verifique sus credenciales.";
            set({ isLoading: false, error: msg });
            return { success: false, error: msg };
          }

          const data = await res.json();
          set({
            token: data.access_token,
            adminUser: data.user,
            isLoading: false,
            error: null,
          });
          return { success: true, user: data.user };
        } catch (err) {
          const msg = err.message || "Error al conectar con el servidor.";
          set({ isLoading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      logout: () => {
        set({ token: null, adminUser: null, error: null, isLoading: false });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return false;

        try {
          const res = await fetch(`${API_URL}/api/admin/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            get().logout();
            return false;
          }

          const user = await res.json();
          set({ adminUser: user });
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: "natbell-admin-auth-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : null)),
      partialize: (state) => ({ token: state.token, adminUser: state.adminUser }),
    }
  )
);
