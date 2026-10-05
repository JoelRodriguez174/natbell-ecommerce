import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

// Mock de usePathname
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("WhatsAppButton Component", () => {
  it("renderiza el botón flotante con el enlace correcto y número 2657-63-7180", () => {
    mockUsePathname.mockReturnValue("/");

    render(<WhatsAppButton />);

    const link = screen.getByTestId("floating-whatsapp-btn");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("5492657637180"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Contactar por WhatsApp")).toBeInTheDocument();
  });

  it("se oculta en rutas del panel de administración (/admin)", () => {
    mockUsePathname.mockReturnValue("/admin/pedidos");

    const { container } = render(<WhatsAppButton />);
    expect(container.firstChild).toBeNull();
  });
});
