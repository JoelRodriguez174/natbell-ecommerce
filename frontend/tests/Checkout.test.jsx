import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EmptyCheckout from "../src/components/checkout/EmptyCheckout";
import OrderSummary from "../src/components/checkout/OrderSummary";
import CustomerInfoStep from "../src/components/checkout/CustomerInfoStep";

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
});
