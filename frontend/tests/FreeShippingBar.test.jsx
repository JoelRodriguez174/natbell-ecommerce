import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FreeShippingBar from "../src/components/cart/FreeShippingBar";

describe("FreeShippingBar Component", () => {
  it("muestra la barra de progreso y el monto restante cuando el subtotal es menor al umbral", () => {
    render(<FreeShippingBar subtotal={20000} threshold={60000} />);
    expect(screen.getByTestId("free-shipping-progress")).toBeInTheDocument();
    expect(screen.getByText(/¡Agregá/i)).toBeInTheDocument();
    expect(screen.getByText(/33%/i)).toBeInTheDocument();
  });

  it("muestra el mensaje de felicitaciones y estado 100% bonificado cuando se alcanza el umbral", () => {
    render(<FreeShippingBar subtotal={65000} threshold={60000} />);
    expect(screen.getByTestId("free-shipping-achieved")).toBeInTheDocument();
    expect(screen.getByText(/¡Felicidades! Tenés Envío Gratis/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Bonificado/i)).toBeInTheDocument();
  });

  it("se adapta correctamente si el subtotal es exactamente igual al umbral", () => {
    render(<FreeShippingBar subtotal={60000} threshold={60000} />);
    expect(screen.getByTestId("free-shipping-achieved")).toBeInTheDocument();
  });
});
