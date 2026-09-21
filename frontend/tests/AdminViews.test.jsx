import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboardPage from "../src/app/admin/page";
import AdminProductosPage from "../src/app/admin/productos/page";
import AdminPedidosPage from "../src/app/admin/pedidos/page";
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

  it("renderiza gestión de pedidos y permite generar código de seguimiento con Andreani", async () => {
    const mockOrders = [
      {
        id: "ord-uuid-1",
        order_number: "ORD-2026-00099",
        customer_name: "Lucia Perez",
        customer_email: "lucia@example.com",
        customer_phone: "1198765432",
        status: "paid",
        total: 18500,
        shipping_cost: 2500,
        shipping_address: "Mitre 450",
        shipping_city: "Moron",
        shipping_province: "Buenos Aires",
        shipping_postal_code: "1708",
        created_at: "2026-09-18T14:00:00Z",
      },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/admin/orders?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockOrders, total: 1 }),
        });
      }
      if (url.includes("/generate-andreani-shipment")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            order_number: "ORD-2026-00099",
            status: "shipped",
            tracking_number: "ANDR_TRACK_9999",
            tracking_url: "https://www.andreani.com/#!/informacionEnvio/ANDR_TRACK_9999",
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<AdminPedidosPage />);

    expect(await screen.findByText("Gestión de Pedidos")).toBeInTheDocument();
    expect(await screen.findByText("ORD-2026-00099")).toBeInTheDocument();
    expect(screen.getByText("Lucia Perez")).toBeInTheDocument();

    // Abrir modal de gestión
    const gestionarBtn = screen.getByRole("button", { name: /gestionar/i });
    fireEvent.click(gestionarBtn);

    expect(await screen.findByText("Actualizar Pedido ORD-2026-00099")).toBeInTheDocument();

    // Verificar botón de generación
    const generarBtn = screen.getByRole("button", { name: /generar (número|codigo) de seguimiento/i });
    expect(generarBtn).toBeInTheDocument();

    // Disparar generación
    fireEvent.click(generarBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/orders/ORD-2026-00099/generate-andreani-shipment"),
        expect.objectContaining({ method: "POST" })
      );
    });

    // Debe actualizar el input de tracking a ANDR_TRACK_9999
    expect(await screen.findByDisplayValue("ANDR_TRACK_9999")).toBeInTheDocument();
  });

  it("muestra indicaciones de entrega del cliente como solo lectura sin modificarlas en PATCH", async () => {
    const mockOrderWithNotes = {
      id: "ord-uuid-2",
      order_number: "ORD-2026-00100",
      customer_name: "Mariano Alvarez",
      customer_email: "mariano@example.com",
      customer_phone: "1122334455",
      status: "paid",
      total: 24000,
      shipping_cost: 0,
      shipping_address: "Av. Corrientes 1500 Piso 4B",
      shipping_city: "CABA",
      shipping_province: "Buenos Aires",
      shipping_postal_code: "1042",
      notes: "Dejar en portería con el encargado Carlos",
      created_at: "2026-09-18T15:00:00Z",
    };

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes("/api/admin/orders?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [mockOrderWithNotes], total: 1 }),
        });
      }
      if (url.includes("/status") && opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: "shipped" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<AdminPedidosPage />);

    // Verifica que figure en la tabla
    expect(await screen.findByText("ORD-2026-00100")).toBeInTheDocument();
    expect(screen.getByText(/Dejar en portería con el encargado Carlos/i)).toBeInTheDocument();

    // Abrir modal
    const gestionarBtn = screen.getByRole("button", { name: /gestionar/i });
    fireEvent.click(gestionarBtn);

    // Debe mostrar la sección de solo lectura de indicaciones del cliente
    expect(await screen.findByText("Indicaciones de Entrega del Cliente")).toBeInTheDocument();
    expect(screen.getAllByText(/“Dejar en portería con el encargado Carlos”|«Dejar en portería con el encargado Carlos»|"Dejar en portería con el encargado Carlos"/i)).toHaveLength(2);

    // No debe haber un textarea para editar las notas del cliente
    expect(screen.queryByPlaceholderText(/observaciones de despacho/i)).not.toBeInTheDocument();

    // Guardar cambios
    const guardarBtn = screen.getByRole("button", { name: /guardar cambios/i });
    fireEvent.click(guardarBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/orders/ORD-2026-00100/status"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            status: "shipped",
            tracking_number: null,
          }),
        })
      );
    });
  });
});

