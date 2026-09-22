import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NavbarDesktopNav from "../src/components/layout/NavbarDesktopNav";

const mockCategories = [
  { label: "Inicio", href: "/" },
  { label: "Todo el Catálogo", href: "/productos" },
  { label: "Destacados", href: "/#destacados" },
  { label: "Ofertas", href: "/productos?on_sale=true" },
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
];

describe("NavbarDesktopNav Component", () => {
  it("renderiza todos los enlaces de categorías correctamente", () => {
    render(<NavbarDesktopNav navCategories={mockCategories} currentPath="/" />);

    expect(screen.getByRole("link", { name: /inicio/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /todo el catálogo/i })).toHaveAttribute("href", "/productos");
    expect(screen.getByRole("link", { name: /destacados/i })).toHaveAttribute("href", "/#destacados");
    expect(screen.getByRole("link", { name: /ofertas/i })).toHaveAttribute("href", "/productos?on_sale=true");
    expect(screen.getByRole("link", { name: /sobre nosotros/i })).toHaveAttribute("href", "/sobre-nosotros");
  });

  it("resalta visualmente la ruta activa actual", () => {
    render(<NavbarDesktopNav navCategories={mockCategories} currentPath="/productos" />);

    const catalogLink = screen.getByRole("link", { name: /todo el catálogo/i });
    expect(catalogLink.className).toContain("text-[#DE1B76]");
  });

  it("renderiza el badge 'Sale' en la pestaña de Ofertas", () => {
    render(<NavbarDesktopNav navCategories={mockCategories} currentPath="/" />);

    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("no renderiza nada si navCategories está vacío", () => {
    const { container } = render(<NavbarDesktopNav navCategories={[]} currentPath="/" />);
    expect(container.firstChild).toBeNull();
  });
});
