import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import CartDrawer from "../src/components/cart/CartDrawer";
import { useCartStore } from "../src/store/useCartStore";

describe("CartDrawer Component", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: true });
  });

  it("no renderiza nada cuando isOpen es false", () => {
    useCartStore.setState({ isOpen: false });
    const { container } = render(<CartDrawer />);
    expect(container.firstChild).toBeNull();
  });

  it("muestra el estado vacío cuando no hay ítems en el carrito", () => {
    render(<CartDrawer />);
    expect(screen.getByTestId("cart-empty-state")).toBeInTheDocument();
    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("muestra los ítems agregados, permite modificar cantidades y eliminar", () => {
    const mockItem = {
      itemKey: "prod-1_default",
      productId: "prod-1",
      slug: "shampoo-nov",
      name: "Shampoo Reparador Nov",
      brandName: "Nov",
      price: 4000,
      quantity: 2,
      maxStock: 10,
    };

    useCartStore.setState({ items: [mockItem], isOpen: true });

    render(<CartDrawer />);
    expect(screen.getByText("Shampoo Reparador Nov")).toBeInTheDocument();
    // Aparece en el total del ítem y en el subtotal del footer
    expect(screen.getAllByText(/\$\s*8\.000/)).toHaveLength(2);
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();


    // Incrementar cantidad (requiere confirmación)
    const incBtn = screen.getByTestId("qty-increase-prod-1_default");
    fireEvent.click(incBtn);
    // Antes de confirmar, el store no se altera (protección contra click accidental)
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    const confirmBtn = screen.getByTestId("qty-confirm-prod-1_default");
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Eliminar ítem con botón X en la esquina superior derecha
    const removeBtn = screen.getByTestId("remove-item-prod-1_default");
    fireEvent.click(removeBtn);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("cierra el drawer al hacer click en el botón de cierre", () => {
    render(<CartDrawer />);
    const closeBtn = screen.getByTestId("close-cart-btn");
    fireEvent.click(closeBtn);

    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("permite escribir la cantidad manualmente en el drawer y la corrige al stock máximo si se excede", () => {
    const mockItem = {
      itemKey: "prod-1_default",
      productId: "prod-1",
      slug: "shampoo-nov",
      name: "Shampoo Reparador Nov",
      brandName: "Nov",
      price: 4000,
      quantity: 1,
      maxStock: 5,
    };

    useCartStore.setState({ items: [mockItem], isOpen: true });

    render(<CartDrawer />);
    const input = screen.getByTestId("qty-input-prod-1_default");
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("1");

    // Usuario tipea 99 teniendo maxStock 5
    fireEvent.change(input, { target: { value: "99" } });
    expect(input.value).toBe("5");

    // Confirma la cantidad corregida
    const confirmBtn = screen.getByTestId("qty-confirm-prod-1_default");
    fireEvent.click(confirmBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });
});
