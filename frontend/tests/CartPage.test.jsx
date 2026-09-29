import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CartPage from "../src/app/carrito/page";
import { useCartStore } from "../src/store/useCartStore";
import { useShippingStore } from "../src/store/useShippingStore";

vi.mock("../src/lib/api", () => ({
  getShippingQuote: vi.fn(),
  getProducts: vi.fn().mockResolvedValue({ items: [] }),
}));

describe("CartPage Component", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
    useShippingStore.getState().clearShipping();
  });

  it("renderiza el estado vacío cuando no hay ítems en el carrito", () => {
    render(<CartPage />);
    expect(screen.getByTestId("cart-page-empty")).toBeInTheDocument();
    expect(
      screen.getByText("Tu carrito actualmente no tiene productos")
    ).toBeInTheDocument();
  });

  it("renderiza los productos agregados, subtotal y cotizador de envíos", () => {
    const mockItem = {
      itemKey: "prod-1_default",
      productId: "prod-1",
      slug: "acondicionador-nov",
      name: "Acondicionador Nov 500ml",
      brandName: "Nov",
      price: 5000,
      quantity: 1,
      maxStock: 10,
    };

    useCartStore.setState({ items: [mockItem] });

    render(<CartPage />);
    expect(screen.getByText("Acondicionador Nov 500ml")).toBeInTheDocument();
    expect(screen.getByTestId("proceed-to-checkout-btn")).toBeInTheDocument();
    expect(screen.getByTestId("shipping-calculator")).toBeInTheDocument();
  });

  it("permite escribir la cantidad manualmente y corrige al stock máximo si se excede", () => {
    const mockItem = {
      itemKey: "prod-1_default",
      productId: "prod-1",
      slug: "acondicionador-nov",
      name: "Acondicionador Nov 500ml",
      brandName: "Nov",
      price: 5000,
      quantity: 2,
      maxStock: 8,
    };

    useCartStore.setState({ items: [mockItem] });

    render(<CartPage />);
    const input = screen.getByTestId("cart-page-qty-input-prod-1_default");
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("2");

    // Usuario ingresa 99 cuando el maxStock es 8
    fireEvent.change(input, { target: { value: "99" } });
    expect(useCartStore.getState().items[0].quantity).toBe(8);

    // Usuario ingresa 0
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("muestra la barra de progreso cuando el subtotal no alcanza $60.000", () => {
    const mockItem = {
      itemKey: "prod-1_default",
      productId: "prod-1",
      slug: "acondicionador-nov",
      name: "Acondicionador Nov 500ml",
      brandName: "Nov",
      price: 20000,
      quantity: 1,
      maxStock: 8,
    };
    useCartStore.setState({ items: [mockItem] });

    render(<CartPage />);
    expect(screen.getByTestId("free-shipping-progress")).toBeInTheDocument();
  });

  it("bonifica el envío a gratis cuando el subtotal supera los $60.000", () => {
    const mockItem = {
      itemKey: "prod-combo_default",
      productId: "prod-combo",
      slug: "combo-nutricion",
      name: "Combo Nutrición Total",
      brandName: "Nov",
      price: 35000,
      quantity: 2, // Total: $70.000 (> $60.000)
      maxStock: 10,
    };
    useCartStore.setState({ items: [mockItem] });
    useShippingStore.getState().setQuote({
      zone_name: "CABA",
      cost: 3500,
      estimated_days: 2,
      postal_code: "1414",
      description: "Entrega express",
    });

    render(<CartPage />);
    // La barra debe indicar logro de envío gratis
    expect(screen.getByTestId("free-shipping-achieved")).toBeInTheDocument();
    // En el resumen de compra y cotizador debe mostrar "¡Gratis!"
    expect(screen.getAllByText("¡Gratis!").length).toBeGreaterThanOrEqual(1);
  });
});

