import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OrderTrackingView from "../src/components/checkout/OrderTrackingView";

describe("OrderTrackingView (Natbell)", () => {
  const sampleOrder = {
    order_number: "ORD-2026-00042",
    status: "paid",
    customer_name: "Mariana Lopez",
    customer_email: "mariana@example.com",
    shipping_address: "Av. Rivadavia 4500",
    shipping_city: "Caballito",
    shipping_province: "CABA",
    shipping_postal_code: "1405",
    shipping_cost: 1500,
    subtotal: 9000,
    total: 10500,
    created_at: "2026-09-16T12:00:00Z",
    items: [
      {
        id: "item-1",
        product_name: "Máscara Capilar Ácida",
        variant_name: "1000ml",
        sku: "NOV-3001",
        quantity: 2,
        unit_price: 4500,
        subtotal: 9000,
      },
    ],
  };

  it("renders order tracking information and items", () => {
    render(<OrderTrackingView order={sampleOrder} />);

    expect(screen.getByText("ORD-2026-00042")).toBeInTheDocument();
    expect(screen.getByText("Mariana Lopez")).toBeInTheDocument();
    expect(screen.getByText("Máscara Capilar Ácida")).toBeInTheDocument();
    expect(screen.getByText(/\$ 10\.500/i)).toBeInTheDocument();
  });

  it("indicates payment confirmed when status is paid", () => {
    render(<OrderTrackingView order={sampleOrder} />);
    const elements = screen.getAllByText(/pago acreditado/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});
