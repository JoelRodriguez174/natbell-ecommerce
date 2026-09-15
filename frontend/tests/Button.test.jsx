import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "../src/components/ui/Button";

describe("Button component", () => {
  it("renderiza correctamente con su texto", () => {
    render(<Button>Comprar Ahora</Button>);
    const button = screen.getByRole("button", { name: /comprar ahora/i });
    expect(button).toBeInTheDocument();
  });

  it("deshabilita el botón cuando disabled es true", () => {
    render(<Button disabled>Deshabilitado</Button>);
    const button = screen.getByRole("button", { name: /deshabilitado/i });
    expect(button).toBeDisabled();
  });

  it("muestra estado de carga y deshabilita la interacción", () => {
    render(<Button isLoading>Cargando</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
