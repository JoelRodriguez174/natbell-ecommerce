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
  deleteDraftOrder: vi.fn().mockResolvedValue({ status: "deleted" }),
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

  it("autocompleta el código postal y dispara la cotización al seleccionar una ciudad en ShippingAddressStep", () => {
    const onQuotePostalCode = vi.fn();
    const setValue = vi.fn();

    render(
      <ShippingAddressStep
        formData={{ shipping_province: "Buenos Aires" }}
        setValue={setValue}
        onQuotePostalCode={onQuotePostalCode}
      />
    );

    const citySelect = screen.getByLabelText(/2\. ciudad \/ localidad/i);
    fireEvent.change(citySelect, { target: { value: "Mar del Plata" } });

    expect(setValue).toHaveBeenCalledWith("shipping_postal_code", "7600", { shouldValidate: true });
    expect(onQuotePostalCode).toHaveBeenCalledWith("7600");
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

    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("permite alternar entre 'Envío a Domicilio' y 'Retiro en Sucursal' en ShippingAddressStep", () => {
    const setValue = vi.fn();
    const onChange = vi.fn();

    render(
      <ShippingAddressStep
        formData={{ shipping_province: "Córdoba", shipping_city: "Córdoba" }}
        setValue={setValue}
        onChange={onChange}
      />
    );

    // Inicialmente está en Envío a Domicilio
    expect(screen.getByLabelText(/calle y número/i)).toBeInTheDocument();
    expect(screen.queryByText(/retiro en sucursal andreani oficial/i)).not.toBeInTheDocument();

    // Cambiar a Retiro en Sucursal
    const branchBtn = screen.getByRole("button", { name: /retiro en sucursal/i });
    fireEvent.click(branchBtn);

    // Debe ocultar Calle y Número y mostrar la información de la sucursal Andreani sin campo ambiguo de preferencia
    expect(screen.queryByLabelText(/calle y número/i)).not.toBeInTheDocument();
    expect(screen.getByText(/retiro en sucursal andreani oficial/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/aclaración o sucursal preferida/i)).not.toBeInTheDocument();

    // Debe haber actualizado shipping_address con la sucursal de Córdoba
    expect(setValue).toHaveBeenCalledWith(
      "shipping_address",
      "Retiro en Sucursal Andreani - Córdoba",
      { shouldValidate: true }
    );

    // Cambiar de regreso a Domicilio
    const homeBtn = screen.getByRole("button", { name: /envío a domicilio/i });
    fireEvent.click(homeBtn);

    // Vuelve a mostrar el campo de Calle y Número
    expect(screen.getByLabelText(/calle y número/i)).toBeInTheDocument();
    expect(screen.queryByText(/retiro en sucursal andreani oficial/i)).not.toBeInTheDocument();
  });

  it("procesa la orden con Retiro en Sucursal sin requerir calle particular", async () => {
    useCartStore.setState({
      items: [{ itemKey: "p2", name: "Máscara Capilar", price: 3000, quantity: 1, maxStock: 5 }],
    });

    render(<CheckoutPage />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/nombre y apellido/i), {
        target: { value: "Carlos Branch" },
      });
      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: "carlos@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: "3512345678" },
      });
      // Elegir Retiro en Sucursal
      fireEvent.click(screen.getByRole("button", { name: /retiro en sucursal/i }));

      // Seleccionar provincia
      fireEvent.change(screen.getByLabelText(/1\. provincia/i), {
        target: { value: "Córdoba" },
      });
    });

    await act(async () => {
      // Seleccionar ciudad
      fireEvent.change(screen.getByLabelText(/2\. ciudad \/ localidad/i), {
        target: { value: "Villa Carlos Paz" },
      });
    });

    // Enviar formulario sin haber completado ninguna dirección de calle de casa
    await act(async () => {
      const payBtn = screen.getByText(/pagar con mercado pago/i);
      fireEvent.click(payBtn);
    });

    // El carrito permanece intacto (APB) y la orden se procesa
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});



