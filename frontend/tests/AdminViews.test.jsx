import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboardPage from "../src/app/admin/page";
import { useAdminAuthStore } from "../src/store/useAdminAuthStore";

describe("Admin Views", () => {
  beforeEach(() => {
    useAdminAuthStore.setState({
      token: "mock-token-xyz",
      adminUser: { id: "123", name: "Valeria Admin", email: "admin@natbell.com" },
      isLoading: false,
    });
    vi.restoreAllMocks();
  });

  it("renderiza el dashboard y muestra bienvenida al administrador", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_revenue: 125000,
        today_revenue: 25000,
        total_orders: 15,
        pending_orders: 2,
        paid_orders: 4,
        shipped_orders: 8,
        delivered_orders: 1,
        low_stock_count: 3,
        low_stock_variants: [],
        recent_orders: [],
      }),
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText(/Resumen General/i)).toBeInTheDocument();
    expect(await screen.findByText(/Valeria Admin/i)).toBeInTheDocument();
    expect(await screen.findByText(/Facturación Total/i)).toBeInTheDocument();
    expect(await screen.findByText(/Por Despachar/i)).toBeInTheDocument();
  });
});
