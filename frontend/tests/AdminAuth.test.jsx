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
      lastActivity: Date.now(),
    });

    useAdminAuthStore.getState().logout();

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.adminUser).toBeNull();
    expect(state.lastActivity).toBeNull();
  });

  it("actualiza lastActivity al invocar updateActivity() si hay token activo", () => {
    const initialTime = Date.now() - 60000; // 1 minuto atras
    useAdminAuthStore.setState({
      token: "active-token",
      lastActivity: initialTime,
    });

    useAdminAuthStore.getState().updateActivity();

    const state = useAdminAuthStore.getState();
    expect(state.lastActivity).toBeGreaterThan(initialTime);
  });

  it("expira la sesión y ejecuta logout si la inactividad supera 5 minutos", () => {
    const fiveMinutesOneSecondAgo = Date.now() - (5 * 60 * 1000 + 1000);
    useAdminAuthStore.setState({
      token: "active-token",
      adminUser: { name: "Admin" },
      lastActivity: fiveMinutesOneSecondAgo,
    });

    const isExpired = useAdminAuthStore.getState().checkInactivity();
    expect(isExpired).toBe(true);

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.adminUser).toBeNull();
  });

  it("mantiene la sesión si la inactividad es menor a 5 minutos", () => {
    const threeMinutesAgo = Date.now() - (3 * 60 * 1000);
    useAdminAuthStore.setState({
      token: "active-token",
      adminUser: { name: "Admin" },
      lastActivity: threeMinutesAgo,
    });

    const isExpired = useAdminAuthStore.getState().checkInactivity();
    expect(isExpired).toBe(false);

    const state = useAdminAuthStore.getState();
    expect(state.token).toBe("active-token");
    expect(state.adminUser).not.toBeNull();
  });

  it("checkAuth() rechaza y desloguea si la sesión expiró por inactividad", async () => {
    const sixMinutesAgo = Date.now() - (6 * 60 * 1000);
    useAdminAuthStore.setState({
      token: "active-token",
      adminUser: { name: "Admin" },
      lastActivity: sixMinutesAgo,
    });

    global.fetch = vi.fn();

    const isAuth = await useAdminAuthStore.getState().checkAuth();
    expect(isAuth).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
  });
});
