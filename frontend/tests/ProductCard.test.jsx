import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "../src/components/product/ProductCard";

describe("ProductCard component", () => {
  const sampleProduct = {
    id: "prod-1",
    name: "Shampoo Keratina Profesional 1000ml",
    slug: "shampoo-keratina-1000ml",
    brand_name: "La Puissance",
    category_name: "Cuidado Capilar",
    base_price: 18500,
    images: ["https://example.com/shampoo.webp"],
    is_featured: true,
    is_on_sale: true,
    total_stock: 15,
    has_variants: true,
  };

  it("renderiza correctamente el nombre, marca y precio del producto", () => {
    render(<ProductCard product={sampleProduct} />);

    expect(screen.getByText("Shampoo Keratina Profesional 1000ml")).toBeInTheDocument();
    expect(screen.getByText("La Puissance")).toBeInTheDocument();
    expect(screen.getByText("Cuidado Capilar")).toBeInTheDocument();
    expect(screen.getByText(/\$\s?18\.500/)).toBeInTheDocument();
  });

  it("no muestra badges circulares innecesarios como DESTACADO ni AGOTADO", () => {
    render(<ProductCard product={sampleProduct} />);

    expect(screen.queryByText("DESTACADO")).toBeNull();
    expect(screen.queryByText("AGOTADO")).toBeNull();
  });

  it("renderiza el producto en el repertorio con stock disponible", () => {
    const productWithStock = { ...sampleProduct, total_stock: 20 };
    const { container } = render(<ProductCard product={productWithStock} />);

    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText("Shampoo Keratina Profesional 1000ml")).toBeInTheDocument();
  });
});
