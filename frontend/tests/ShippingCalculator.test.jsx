import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ShippingCalculator from "../src/components/cart/ShippingCalculator";
import { useShippingStore } from "../src/store/useShippingStore";
import * as api from "../src/lib/api";

vi.mock("../src/lib/api", () => ({
  getShippingQuote: vi.fn(),
}));

describe("ShippingCalculator Component", () => {
  beforeEach(() => {
    useShippingStore.getState().clearShipping();
    vi.clearAllMocks();
  });

  it("renderiza el input y el botón de calcular", () => {
    render(<ShippingCalculator />);
    expect(screen.getByTestId("shipping-calculator")).toBeInTheDocument();
    expect(screen.getByTestId("postal-code-input")).toBeInTheDocument();
    expect(screen.getByTestId("calculate-shipping-btn")).toBeInTheDocument();
  });

  it("muestra error si el usuario envía código postal vacío", () => {
    render(<ShippingCalculator />);
    const form = screen.getByTestId("shipping-calculator").querySelector("form");
    fireEvent.submit(form);

    expect(screen.getByTestId("shipping-error")).toHaveTextContent(
      "Por favor ingresá un código postal"
    );
  });

  it("calcula y muestra la cotización exitosamente", async () => {
    api.getShippingQuote.mockResolvedValueOnce({
      zone_name: "CABA",
      cost: 3500.0,
      estimated_days: 2,
      postal_code: "1414",
      description: "Entrega express en Ciudad Autónoma de Buenos Aires",
    });

    render(<ShippingCalculator />);
    const input = screen.getByTestId("postal-code-input");
    fireEvent.change(input, { target: { value: "1414" } });

    const btn = screen.getByTestId("calculate-shipping-btn");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("shipping-result")).toBeInTheDocument();
    });

    expect(screen.getByText("CABA")).toBeInTheDocument();
    expect(screen.getByText("$ 3.500")).toBeInTheDocument();
  });

  it("muestra mensaje de error cuando la API falla o código postal es inválido", async () => {
    api.getShippingQuote.mockRejectedValueOnce(
      new Error("Código postal fuera del rango válido de Argentina")
    );

    render(<ShippingCalculator />);
    const input = screen.getByTestId("postal-code-input");
    fireEvent.change(input, { target: { value: "0500" } });

    const btn = screen.getByTestId("calculate-shipping-btn");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("shipping-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("shipping-error")).toHaveTextContent(
      "Código postal fuera del rango válido de Argentina"
    );
  });
});
