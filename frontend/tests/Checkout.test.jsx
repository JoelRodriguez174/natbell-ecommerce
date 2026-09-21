import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EmptyCheckout from "../src/components/checkout/EmptyCheckout";
import OrderSummary from "../src/components/checkout/OrderSummary";
import CustomerInfoStep from "../src/components/checkout/CustomerInfoStep";
import ShippingAddressStep from "../src/components/checkout/ShippingAddressStep";
import PagoExitosoPage from "../src/app/pago/exitoso/page";
import CheckoutPage from "../src/app/checkout/page";
import { useCartStore } from "../src/store/useCartStore";

vi.mock("../src/lib/api", () => ({
  createOrder: vi.fn().mockResolvedValue({ checkout_url: "https://mercadopago.com/checkout/123" }),
  getShippingQuote: vi.fn().mockResolvedValue({
    zone_name: "CABA",
    cost: 1500,
    estimated_days: 2,
    description: "Envío Estándar",
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key) => (key === "order" ? "ORD-2026-TEST" : null),
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));



describe("Checkout Components (Natbell)", () => {
  it("renders EmptyCheckout properly with message and link", () => {
    render(<EmptyCheckout />);
    expect(screen.getByText(/no hay productos agregados actualmente/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorar catálogo/i })).toBeInTheDocument();
  });

  it("renders CustomerInfoStep and updates form values", () => {
    const formData = {
      customer_name: "Esteban Perez",
      customer_email: "esteban@example.com",
      customer_phone: "1122334455",
    };
    const onChange = vi.fn();

    render(<CustomerInfoStep formData={formData} onChange={onChange} />);

    expect(screen.getByLabelText(/nombre y apellido/i)).toHaveValue("Esteban Perez");
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue("esteban@example.com");
    expect(screen.getByLabelText(/teléfono/i)).toHaveValue("1122334455");
  });

  it("renders OrderSummary with items, shipping and total", () => {
    const items = [
      {
        itemKey: "p1_v1",
        name: "Serum Reparador de Puntas",
        variantName: "100ml",
        price: 4500,
        quantity: 2,
      },
    ];

    render(
      <OrderSummary
        items={items}
        subtotal={9000}
        shippingCost={1500}
        total={10500}
        isLoading={false}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Serum Reparador de Puntas")).toBeInTheDocument();
    expect(screen.getByText(/pagar con mercado pago/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ 10\.500/i)).toBeInTheDocument();
  });

  it("muestra el error de cotización reactivamente en ShippingAddressStep cuando se recibe quoteError", () => {
    render(
      <ShippingAddressStep
        formData={{}}
        quoteError="Código postal sin cobertura disponible"
      />
    );

    expect(screen.getByText("Código postal sin cobertura disponible")).toBeInTheDocument();
  });

  it("limpia el carrito cuando se accede a la página de Pago Exitoso (compra concretada)", () => {
    useCartStore.setState({
      items: [{ itemKey: "p1", name: "Producto Test", price: 1000, quantity: 1 }],
    });
    expect(useCartStore.getState().items).toHaveLength(1);

    render(<PagoExitosoPage />);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("no vacía el carrito al procesar la orden en CheckoutPage", async () => {
    useCartStore.setState({
      items: [{ itemKey: "p1", name: "Producto Test", price: 1000, quantity: 1, maxStock: 10 }],
    });

    render(<CheckoutPage />);

    // Rellenar campos mínimos del formulario con act
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/nombre y apellido/i), {
        target: { value: "Laura Gomez" },
      });
      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: "laura@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: "1144556677" },
      });
      fireEvent.change(screen.getByLabelText(/calle y número/i), {
        target: { value: "Av Corrientes 1234" },
      });
      fireEvent.change(screen.getByLabelText(/1\. provincia/i), {
        target: { value: "CABA" },
      });
      fireEvent.change(screen.getByLabelText(/código postal/i), {
        target: { value: "1414" },
      });
    });

    await act(async () => {
      const payBtn = screen.getByText(/pagar con mercado pago/i);
      fireEvent.click(payBtn);
    });

    // El carrito no se vacía aquí; solo se vacía cuando concrete la compra en /pago/exitoso
    expect(useCartStore.getState().items).toHaveLength(1);
  });

});


