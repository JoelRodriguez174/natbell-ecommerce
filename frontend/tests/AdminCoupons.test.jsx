import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminCouponsPage from "../src/app/admin/cupones/page";
import CouponKpis from "../src/components/admin/coupons/CouponKpis";
import CouponCreateModal from "../src/components/admin/coupons/CouponCreateModal";
import CouponsTable from "../src/components/admin/coupons/CouponsTable";
import { useAdminAuthStore } from "../src/store/useAdminAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("Admin Coupons - Componentes Modulares", () => {
  beforeEach(() => {
    useAdminAuthStore.setState({
      token: "mock-token-xyz",
      adminUser: { id: "123", name: "Admin Natbell", email: "admin@natbell.com" },
      isLoading: false,
    });
    vi.restoreAllMocks();
  });

  it("CouponKpis muestra métricas correctamente", () => {
    render(<CouponKpis totalCoupons={10} activeCoupons={8} totalTimesUsed={42} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/Total Cupones/i)).toBeInTheDocument();
    expect(screen.getByText(/Cupones Activos/i)).toBeInTheDocument();
    expect(screen.getByText(/Usos Canjeados/i)).toBeInTheDocument();
  });

  it("CouponCreateModal valida stepper de porcentaje y envía datos correctos", async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <CouponCreateModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />
    );

    const codeInput = screen.getByPlaceholderText(/EJ: VERANO20/i);
    fireEvent.change(codeInput, { target: { value: "descuento15" } });
    expect(codeInput.value).toBe("DESCUENTO15");

    // Stepper buttons
    const incButton = screen.getByTitle(/Subir 1%/i);
    const decButton = screen.getByTitle(/Bajar 1%/i);

    // Initial is 10
    fireEvent.click(incButton);
    fireEvent.click(incButton);
    // Now should be 12

    fireEvent.click(decButton);
    // Now 11

    const submitBtn = screen.getByRole("button", { name: /Crear Cupón/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "DESCUENTO15",
          discount_percent: 11,
          is_active: true,
        })
      );
    });
  });

  it("CouponsTable filtra cupones por búsqueda y renderiza lista", () => {
    const mockCoupons = [
      {
        id: "c-1",
        code: "BIENVENIDA10",
        discount_percent: 10,
        is_active: true,
        times_used: 5,
        max_uses: 100,
        expires_at: null,
      },
      {
        id: "c-2",
        code: "BLACKFRIDAY",
        discount_percent: 30,
        is_active: false,
        times_used: 10,
        max_uses: 10,
        expires_at: "2026-12-31T23:59:59Z",
      },
    ];

    const handleSearchChange = vi.fn();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();
    const handleCreate = vi.fn();

    const { rerender } = render(
      <CouponsTable
        coupons={mockCoupons}
        search=""
        onSearchChange={handleSearchChange}
        isLoading={false}
        isError={false}
        error={null}
        onToggleStatus={handleToggle}
        isToggling={false}
        onDeleteClick={handleDelete}
        onOpenCreate={handleCreate}
      />
    );

    expect(screen.getByText("BIENVENIDA10")).toBeInTheDocument();
    expect(screen.getByText("BLACKFRIDAY")).toBeInTheDocument();
    expect(screen.getByText("10% OFF")).toBeInTheDocument();
    expect(screen.getByText("30% OFF")).toBeInTheDocument();

    // Rerender con filtro
    rerender(
      <CouponsTable
        coupons={mockCoupons}
        search="bien"
        onSearchChange={handleSearchChange}
        isLoading={false}
        isError={false}
        error={null}
        onToggleStatus={handleToggle}
        isToggling={false}
        onDeleteClick={handleDelete}
        onOpenCreate={handleCreate}
      />
    );

    expect(screen.getByText("BIENVENIDA10")).toBeInTheDocument();
    expect(screen.queryByText("BLACKFRIDAY")).not.toBeInTheDocument();
  });

  it("AdminCouponsPage orquesta la carga y renderiza la tabla", async () => {
    const mockCoupons = [
      {
        id: "c-1",
        code: "NATBELL15",
        discount_percent: 15,
        is_active: true,
        times_used: 2,
        max_uses: null,
        expires_at: null,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCoupons,
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdminCouponsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Gestión de Cupones/i)).toBeInTheDocument();
    expect(await screen.findByText("NATBELL15")).toBeInTheDocument();
    expect(await screen.findByText("15% OFF")).toBeInTheDocument();
  });
});
