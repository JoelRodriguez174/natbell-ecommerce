import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useAdminAuthStore } from "../src/store/useAdminAuthStore";
import AdminRegistroPage from "../src/app/admin/registro/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Admin Registration & Recovery Flow", () => {
  beforeEach(() => {
    useAdminAuthStore.setState({
      token: null,
      adminUser: null,
      isLoading: false,
      error: null,
    });
    vi.restoreAllMocks();
  });

  describe("Store actions", () => {
    it("register() envía los datos a la API de registro", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Código de verificación enviado",
          email: "nuevo@natbell.com",
        }),
      });

      const res = await useAdminAuthStore.getState().register(
        "Carlos Gomez",
        "nuevo@natbell.com",
        "Password123!",
        "NatbellAdmin2026!"
      );

      expect(res.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Carlos Gomez",
            email: "nuevo@natbell.com",
            password: "Password123!",
            invite_code: "NatbellAdmin2026!",
          }),
        })
      );
    });

    it("verifyEmail() valida el OTP y guarda token y usuario autenticado", async () => {
      const mockUser = {
        id: "new-admin-id",
        email: "nuevo@natbell.com",
        name: "Carlos Gomez",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "token-verified-123",
          token_type: "bearer",
          expires_in: 28800,
          user: mockUser,
        }),
      });

      const res = await useAdminAuthStore.getState().verifyEmail("nuevo@natbell.com", "123456");

      expect(res.success).toBe(true);
      const state = useAdminAuthStore.getState();
      expect(state.token).toBe("token-verified-123");
      expect(state.adminUser?.name).toBe("Carlos Gomez");
    });

    it("forgotPassword() envía solicitud de recuperación", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Código enviado",
        }),
      });

      const res = await useAdminAuthStore.getState().forgotPassword("nuevo@natbell.com");
      expect(res.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/auth/forgot-password"),
        expect.anything()
      );
    });

    it("resetPassword() envía nuevo password y código OTP", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Contraseña actualizada exitosamente",
        }),
      });

      const res = await useAdminAuthStore.getState().resetPassword(
        "nuevo@natbell.com",
        "654321",
        "NewSecretPassword123!"
      );
      expect(res.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/auth/reset-password"),
        expect.anything()
      );
    });
  });

  describe("UI /admin/registro page", () => {
    it("renderiza el formulario de registro y avanza al paso 2 al enviar datos válidos", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Código enviado",
          email: "valeria@natbell.com",
        }),
      });

      render(<AdminRegistroPage />);

      expect(screen.getByText(/Registro de Administrador/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Clave Maestra/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
        target: { value: "Valeria Admin" },
      });
      fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
        target: { value: "valeria@natbell.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Contraseña/i), {
        target: { value: "SuperSegura123!" },
      });
      fireEvent.change(screen.getByLabelText(/Clave Maestra/i), {
        target: { value: "NatbellAdmin2026!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Crear Cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/Verificación de Correo/i)).toBeInTheDocument();
        expect(screen.getByText(/valeria@natbell.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
      });
    });
  });
});
