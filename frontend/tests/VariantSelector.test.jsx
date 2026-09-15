import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VariantSelector from "../src/components/product/VariantSelector";

describe("VariantSelector component", () => {
  const sampleVariants = [
    { id: "var-1", name: "250 ml", price_override: 8500, stock: 10 },
    { id: "var-2", name: "500 ml", price_override: 14200, stock: 4 },
    { id: "var-3", name: "1000 ml", price_override: 22000, stock: 0 },
  ];

  it("renderiza todas las opciones de variantes disponibles", () => {
    render(<VariantSelector variants={sampleVariants} basePrice={8500} />);

    expect(screen.getByText("250 ml")).toBeInTheDocument();
    expect(screen.getByText("500 ml")).toBeInTheDocument();
    expect(screen.getByText("1000 ml")).toBeInTheDocument();
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.getByText("¡Últimas 4!")).toBeInTheDocument();
  });

  it("llama a onSelectVariant al hacer click en una variante disponible", () => {
    const handleSelect = vi.fn();
    render(
      <VariantSelector
        variants={sampleVariants}
        onSelectVariant={handleSelect}
        basePrice={8500}
      />
    );

    fireEvent.click(screen.getByText("500 ml"));
    expect(handleSelect).toHaveBeenCalledWith(sampleVariants[1]);
  });

  it("deshabilita variantes sin stock", () => {
    render(<VariantSelector variants={sampleVariants} basePrice={8500} />);
    const buttons = screen.getAllByRole("radio");
    expect(buttons[2]).toHaveAttribute("aria-disabled", "true");
  });
});
