import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DeliveryTypeSelector from "../src/components/checkout/DeliveryTypeSelector";

describe("DeliveryTypeSelector Component", () => {
  it("renders both options: 'Envío a Domicilio' and 'Retiro en Sucursal'", () => {
    render(
      <DeliveryTypeSelector
        deliveryType="home"
        onSelectDeliveryType={vi.fn()}
      />
    );

    expect(screen.getByText(/¿cómo preferís recibir tu compra\?/i)).toBeInTheDocument();
    expect(screen.getByText("Envío a Domicilio")).toBeInTheDocument();
    expect(screen.getByText("Retiro en Sucursal")).toBeInTheDocument();
    expect(screen.getByText(/recibí el paquete en la puerta de tu casa o trabajo/i)).toBeInTheDocument();
    expect(screen.getByText(/retirá en la sucursal andreani oficial/i)).toBeInTheDocument();
  });

  it("triggers onSelectDeliveryType with 'branch' when clicking Retiro en Sucursal", () => {
    const onSelect = vi.fn();
    render(
      <DeliveryTypeSelector
        deliveryType="home"
        onSelectDeliveryType={onSelect}
      />
    );

    const branchBtn = screen.getByRole("button", { name: /retiro en sucursal/i });
    fireEvent.click(branchBtn);

    expect(onSelect).toHaveBeenCalledWith("branch");
  });

  it("triggers onSelectDeliveryType with 'home' when clicking Envío a Domicilio", () => {
    const onSelect = vi.fn();
    render(
      <DeliveryTypeSelector
        deliveryType="branch"
        onSelectDeliveryType={onSelect}
      />
    );

    const homeBtn = screen.getByRole("button", { name: /envío a domicilio/i });
    fireEvent.click(homeBtn);

    expect(onSelect).toHaveBeenCalledWith("home");
  });
});
