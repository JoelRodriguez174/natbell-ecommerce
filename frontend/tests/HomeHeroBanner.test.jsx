import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeHeroBanner from "../src/components/home/HomeHeroBanner";

describe("HomeHeroBanner Component", () => {
  it("renderiza el título principal Natbell y la propuesta mayorista", () => {
    render(<HomeHeroBanner />);

    expect(screen.getByText("NATBELL")).toBeInTheDocument();
    expect(
      screen.getByText("PRODUCTOS PROFESIONALES A PRECIOS MAYORISTAS")
    ).toBeInTheDocument();
    expect(
      screen.getByText("ENCONTRÁ TODO LO QUE NECESITÁS PARA TU NEGOCIO")
    ).toBeInTheDocument();
    expect(
      screen.getByText("¡Envío Sin Cargo en compras superiores a $30.000!")
    ).toBeInTheDocument();
  });

  it("renderiza los logos oficiales de las empresas/marcas a los costados", () => {
    render(<HomeHeroBanner />);

    const brands = [
      "NOV",
      "FRILAYP",
      "EUROSTIL",
      "LA PUISSANCE",
      "PLASMA",
      "PLAYCOLOR",
      "DUGA",
      "JESSAMY",
    ];

    brands.forEach((brand) => {
      const logos = screen.getAllByAltText(new RegExp(`Logo oficial de ${brand}`, "i"));
      expect(logos.length).toBeGreaterThan(0);
    });
  });

  it("posee los enlaces de acción 'Ver Catálogo Completo' y 'Ver Ofertas Especiales'", () => {
    render(<HomeHeroBanner />);

    const catalogoLink = screen.getByRole("link", { name: /Ver Catálogo Completo/i });
    expect(catalogoLink).toHaveAttribute("href", "/productos");

    const ofertasLink = screen.getByRole("link", { name: /Ver Ofertas Especiales/i });
    expect(ofertasLink).toHaveAttribute("href", "/productos?on_sale=true");
  });
});
