import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAdminThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark", // Modo oscuro por defecto para el backoffice admin
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "natbell_admin_theme_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
