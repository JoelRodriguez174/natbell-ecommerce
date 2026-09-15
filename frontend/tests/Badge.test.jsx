import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "../src/components/ui/Badge";

describe("Badge component", () => {
  it("renderiza el texto de la etiqueta correctamente", () => {
    render(<Badge variant="sale">20% OFF</Badge>);
    expect(screen.getByText("20% OFF")).toBeInTheDocument();
  });

  it("aplica clases de la variante especificada", () => {
    const { container } = render(<Badge variant="featured">Destacado</Badge>);
    const span = container.querySelector("span");
    expect(span.className).toContain("text-amber-300");
  });
});
