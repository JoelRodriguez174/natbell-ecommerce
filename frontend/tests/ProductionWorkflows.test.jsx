import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CheckoutPage from "../src/app/checkout/page";
import PagoFallidoPage from "../src/app/pago/fallido/page";
import PagoExitosoPage from "../src/app/pago/exitoso/page";
import PagoPendientePage from "../src/app/pago/pendiente/page";
import { useCartStore } from "../src/store/useCartStore";
import * as api from "../src/lib/api";

// Mocks
vi.mock("../src/lib/api", () => ({
  createOrder: vi.fn(),
  deleteDraftOrder: vi.fn().mockResolvedValue({ status: "deleted" }),
  getShippingQuote: vi.fn().mockResolvedValue({
    zone_name: "CABA",
    cost: 1500,
    estimated_days: 2,
    description: "Envío Estándar",
  }),
}));

const mockSearchParams = new Map();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key) => mockSearchParams.get(key) || null,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Flujos Críticos de Producción Frontend (Natbell)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    useCartStore.setState({ items: [] });
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.clear();
    }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "approved" }),
    });
  });

  // ============================================================================
  // FLUJO 1: Stock Agotado en Tiempo Real (Rechazo claro sin cobro)
  // ============================================================================
  it("captura y muestra el error de stock insuficiente en CheckoutPage sin redirigir al pago", async () => {
    // 1. Cliente tiene el producto en el carrito
    useCartStore.setState({
      items: [
        {
          itemKey: "p1_v1",
          id: "prod-01",
          variantId: "var-01",
          name: "Shampoo Profesional Reparador",
          variantName: "250ml",
          price: 15000,
          quantity: 1,
          maxStock: 1,
        },
      ],
    });

    // 2. Mock del backend rechazando la orden por agotamiento de stock
    api.createOrder.mockRejectedValueOnce(
      new Error("Stock insuficiente para Shampoo Profesional Reparador (250ml). Stock disponible: 0, solicitado: 1.")
    );

    const assignMock = vi.fn();
    delete window.location;
    window.location = { assign: assignMock };

    render(<CheckoutPage />);

    // 3. Completar campos obligatorios del checkout con opciones válidas
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/nombre y apellido/i), {
        target: { value: "Valeria Gómez" },
      });
      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: "valeria@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: "1144332211" },
      });
      fireEvent.change(screen.getByLabelText(/calle y número/i), {
        target: { value: "Av. Santa Fe 1234" },
      });
      fireEvent.change(screen.getByLabelText(/1\. provincia/i), {
        target: { value: "Ciudad Autónoma de Buenos Aires (CABA)" },
      });
      fireEvent.change(screen.getByLabelText(/2\. ciudad \/ localidad/i), {
        target: { value: "Palermo" },
      });
      fireEvent.change(screen.getByLabelText(/código postal/i), {
        target: { value: "1425" },
      });
    });

    // 4. Intentar pagar
    const submitBtn = screen.getByRole("button", { name: /pagar con mercado pago/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // 5. Validar que se renderiza el mensaje exacto de stock insuficiente
    expect(
      await screen.findByText(/Stock insuficiente para Shampoo Profesional Reparador/i)
    ).toBeInTheDocument();

    // 6. Validar que NUNCA se redirigió a la pasarela externa de pago
    expect(assignMock).not.toHaveBeenCalled();

    // 7. Los productos permanecen en el carrito para que el cliente decida modificar la cantidad
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  // ============================================================================
  // FLUJO 2: Pago Fallido / Rechazado (Descarte de Borrador y Retención de Carrito)
  // ============================================================================
  it("descarta la orden borrador al llegar a Pago Fallido y mantiene el carrito intacto", async () => {
    mockSearchParams.set("order", "ORD-2026-00099");
    sessionStorage.setItem("natbell_pending_order", "ORD-2026-00099");

    // El cliente todavía tiene sus artículos en el carrito
    useCartStore.setState({
      items: [
        {
          itemKey: "p1_v1",
          id: "prod-01",
          name: "Serum Capilar Oro",
          price: 8500,
          quantity: 1,
        },
      ],
    });

    render(<PagoFallidoPage />);

    // 1. Mensaje claro al cliente
    expect(screen.getByText(/el pago no se pudo completar/i)).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00099")).toBeInTheDocument();

    // 2. Debe invocar deleteDraftOrder para limpiar la orden 'pending' en backend
    expect(api.deleteDraftOrder).toHaveBeenCalledWith("ORD-2026-00099");

    // 3. Debe remover el pending order de sessionStorage
    expect(sessionStorage.getItem("natbell_pending_order")).toBeNull();

    // 4. El carrito NO se vacía, permitiendo reintentar la compra de inmediato
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.getByRole("link", { name: /reintentar con otro medio de pago/i })).toHaveAttribute(
      "href",
      "/checkout"
    );
  });

  // ============================================================================
  // FLUJO 3: Pago Acreditado Exitosamente (Vaciado de Carrito y Verificación)
  // ============================================================================
  it("vacía el carrito y limpia los borradores al acceder a Pago Exitoso", async () => {
    mockSearchParams.set("order", "ORD-2026-00077");
    mockSearchParams.set("payment_id", "pay-987654");

    useCartStore.setState({
      items: [
        {
          itemKey: "p1_v1",
          id: "prod-01",
          name: "Tratamiento Keratina",
          price: 12000,
          quantity: 1,
        },
      ],
    });

    localStorage.setItem("natbell_checkout_draft", JSON.stringify({ customer_name: "Cliente" }));
    sessionStorage.setItem("natbell_pending_order", "ORD-2026-00077");

    await act(async () => {
      render(<PagoExitosoPage />);
    });

    // 1. Carrito vaciado de forma atómica
    expect(useCartStore.getState().items).toHaveLength(0);

    // 2. Limpieza de claves temporales
    expect(localStorage.getItem("natbell_checkout_draft")).toBeNull();
    expect(sessionStorage.getItem("natbell_pending_order")).toBeNull();

    // 3. Mensajes e identificador
    expect(screen.getByText(/¡pago acreditado con éxito!/i)).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00077")).toBeInTheDocument();

    // 4. Link a seguimiento de orden
    expect(screen.getByRole("link", { name: /ver seguimiento del pedido/i })).toHaveAttribute(
      "href",
      "/pedido/ORD-2026-00077"
    );
  });

  // ============================================================================
  // FLUJO 4: Pago en Proceso / Pendiente (Información clara de Rapipago/Transferencia)
  // ============================================================================
  it("muestra información de acreditación en proceso y acceso al pedido en Pago Pendiente", () => {
    mockSearchParams.set("order", "ORD-2026-00055");

    render(<PagoPendientePage />);

    expect(screen.getByText(/pago en proceso/i)).toBeInTheDocument();
    expect(screen.getByText(/rapipago, pago fácil o transferencia/i)).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00055")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver estado de la orden/i })).toHaveAttribute(
      "href",
      "/pedido/ORD-2026-00055"
    );
  });
});
