import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAdminAuthStore } from "../src/store/useAdminAuthStore";

describe("useAdminAuthStore", () => {
  beforeEach(() => {
    useAdminAuthStore.setState({
      token: null,
      adminUser: null,
      isLoading: false,
      error: null,
    });
    vi.restoreAllMocks();
  });

  it("inicializa con estado vacío de autenticación", () => {
    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.adminUser).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("maneja login exitoso y guarda token", async () => {
    const mockUser = {
      id: "admin-uuid-123",
      email: "admin@natbell.com",
      name: "Admin Natbell",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "mock-jwt-token-xyz",
        token_type: "bearer",
        expires_in: 28800,
        user: mockUser,
      }),
    });

    const result = await useAdminAuthStore.getState().login("admin@natbell.com", "secret123");
    expect(result.success).toBe(true);

    const state = useAdminAuthStore.getState();
    expect(state.token).toBe("mock-jwt-token-xyz");
    expect(state.adminUser?.email).toBe("admin@natbell.com");
    expect(state.error).toBeNull();
  });

  it("maneja error de credenciales incorrectas", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: "Credenciales inválidas",
      }),
    });

    const result = await useAdminAuthStore.getState().login("admin@natbell.com", "wrongpass");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Credenciales inválidas");

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.error).toContain("Credenciales inválidas");
  });

  it("cierra la sesión correctamente con logout()", () => {
    useAdminAuthStore.setState({
      token: "active-token",
      adminUser: { name: "Admin" },
    });

    useAdminAuthStore.getState().logout();

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.adminUser).toBeNull();
  });
});
