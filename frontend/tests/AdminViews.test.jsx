import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboardPage from "../src/app/admin/page";
import AdminProductosPage from "../src/app/admin/productos/page";
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

  it("renderiza catálogo de productos con botón de editar y permite abrir modal de edición", async () => {
    const mockProducts = [
      {
        id: "prod-uuid-1",
        name: "Shampoo Neutro 1L",
        slug: "shampoo-neutro-1l",
        base_price: 15000,
        sale_price: 12000,
        is_on_sale: true,
        is_featured: true,
        is_active: true,
        category_name: "Shampoos",
        brand_name: "Nov Cosmética",
        image_urls: ["https://example.com/shampoo.jpg"],
        variants: [{ id: "var-1", sku: "NOV-001", variant_name: "1 Litro", stock: 15 }],
      },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/products?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockProducts }),
        });
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "cat-1", name: "Shampoos", slug: "shampoos" }],
        });
      }
      if (url.includes("/api/brands")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "brand-1", name: "Nov Cosmética", slug: "nov" }],
        });
      }
      if (url.includes("/api/products/shampoo-neutro-1l")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockProducts[0],
            description: "Shampoo de limpieza profunda",
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<AdminProductosPage />);

    expect(await screen.findByText("Catálogo de Productos")).toBeInTheDocument();
    expect(await screen.findByText("Shampoo Neutro 1L")).toBeInTheDocument();

    // Botón de editar
    const editBtn = screen.getByTitle("Editar / Modificar producto");
    expect(editBtn).toBeInTheDocument();

    // Abrir modal de edición
    fireEvent.click(editBtn);

    expect(await screen.findByText("Modificar Producto")).toBeInTheDocument();
    expect(screen.getByText("Actualizando: Shampoo Neutro 1L")).toBeInTheDocument();
    expect(screen.getByText("Actualizar Producto")).toBeInTheDocument();

    // Verificar previsualización de imagen cargada
    const previewImg = screen.getByAltText("Foto 1");
    expect(previewImg).toBeInTheDocument();
    expect(previewImg.getAttribute("src")).toBe("https://example.com/shampoo.jpg");
  });

  it("permite abrir modal para nuevo producto", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<AdminProductosPage />);

    const nuevoBtn = await screen.findByText("Nuevo Producto");
    fireEvent.click(nuevoBtn);

    await waitFor(() => {
      expect(screen.getByText("Completá los campos para sumar un producto al catálogo.")).toBeInTheDocument();
      expect(screen.getByText("Guardar Producto")).toBeInTheDocument();
    });
  });
});
