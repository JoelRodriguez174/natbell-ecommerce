import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, getCartItemKey } from "../src/store/useCartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  const mockProduct = {
    id: "prod-1",
    name: "Shampoo Nutritivo 500ml",
    slug: "shampoo-nutritivo-500ml",
    brand_name: "Nov",
    category_name: "Tratamientos",
    base_price: 4500,
    sale_price: 3800,
    is_on_sale: true,
    stock: 20,
    images: ["/products/shampoo.webp"],
  };

  const mockVariant = {
    id: "var-1",
    name: "500ml",
    sku: "NOV-SH-500",
    price_override: 3900,
    stock: 15,
  };

  it("genera claves únicas compuestas para variantes", () => {
    expect(getCartItemKey("prod-1")).toBe("prod-1_default");
    expect(getCartItemKey("prod-1", "var-1")).toBe("prod-1_var-1");
  });

  it("agrega un nuevo producto al carrito correctamente", () => {
    const { addItem, items, getTotalItems, getSubtotal } = useCartStore.getState();

    addItem(mockProduct, null, 2);

    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].name).toBe("Shampoo Nutritivo 500ml");
    expect(updated.items[0].quantity).toBe(2);
    // Como está en oferta sin variante con override, toma sale_price (3800)
    expect(updated.items[0].price).toBe(3800);
    expect(updated.getTotalItems()).toBe(2);
    expect(updated.getSubtotal()).toBe(7600);
    expect(updated.isOpen).toBe(true);
  });

  it("agrega un producto con variante y toma el precio de la variante", () => {
    const { addItem } = useCartStore.getState();

    addItem(mockProduct, mockVariant, 1);

    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].variantId).toBe("var-1");
    expect(updated.items[0].variantName).toBe("500ml");
    expect(updated.items[0].price).toBe(3900);
    expect(updated.items[0].quantity).toBe(1);
  });

  it("incrementa la cantidad si el mismo ítem se vuelve a agregar", () => {
    const { addItem } = useCartStore.getState();

    addItem(mockProduct, null, 2);
    addItem(mockProduct, null, 3);

    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(5);
    expect(updated.getTotalItems()).toBe(5);
  });

  it("respeta el límite de stock al incrementar cantidad", () => {
    const { addItem } = useCartStore.getState();

    // mockProduct.stock es 20
    addItem(mockProduct, null, 18);
    addItem(mockProduct, null, 10); // Intentar superar el stock

    const updated = useCartStore.getState();
    expect(updated.items[0].quantity).toBe(20);
  });

  it("actualiza la cantidad de un ítem existente", () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem(mockProduct, null, 2);
    const itemKey = getCartItemKey(mockProduct.id);

    updateQuantity(itemKey, 4);
    expect(useCartStore.getState().items[0].quantity).toBe(4);
  });

  it("elimina el ítem si la cantidad se actualiza a 0 o menor", () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem(mockProduct, null, 2);
    const itemKey = getCartItemKey(mockProduct.id);

    updateQuantity(itemKey, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("elimina un ítem específico con removeItem", () => {
    const { addItem, removeItem } = useCartStore.getState();

    addItem(mockProduct, null, 1);
    addItem({ ...mockProduct, id: "prod-2", name: "Otro Producto" }, null, 1);

    expect(useCartStore.getState().items).toHaveLength(2);

    removeItem(getCartItemKey("prod-1"));
    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].productId).toBe("prod-2");
  });

  it("vacía completamente el carrito con clearCart", () => {
    const { addItem, clearCart } = useCartStore.getState();

    addItem(mockProduct, null, 2);
    expect(useCartStore.getState().items).toHaveLength(1);

    clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it("controla correctamente el estado isOpen del drawer", () => {
    const { openCart, closeCart, toggleCart } = useCartStore.getState();

    expect(useCartStore.getState().isOpen).toBe(false);

    openCart();
    expect(useCartStore.getState().isOpen).toBe(true);

    closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);

    toggleCart();
    expect(useCartStore.getState().isOpen).toBe(true);
  });
});
