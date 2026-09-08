"use client";

import { apiFetch } from "@/lib/api";

const TOKEN_KEY = "losarrayanes_admin_token";
const USER_KEY = "losarrayanes_admin_user";

export const adminAuth = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser: () => {
    if (typeof window === "undefined") return null;
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!adminAuth.getToken();
  },

  login: async (email, password) => {
    const data = await apiFetch("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/admin/login";
    }
  },

  getAuthHeaders: () => {
    const token = adminAuth.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
