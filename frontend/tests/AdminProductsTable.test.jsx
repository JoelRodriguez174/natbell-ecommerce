import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProductsTable from "../src/components/admin/products/ProductsTable";

describe("ProductsTable Component - Ordenamiento y Filtros de Producción", () => {
  const sampleProducts = [
    {
      id: "prod-03",
      name: "Z - Aceite de Argán Puro",
      category_name: "Aceites",
      brand_name: "Plasma",
      base_price: 18000,
      is_active: true,
      stock: 2,
      variants: [{ sku: "SKU-003", stock: 2, variant_name: "50ml" }],
    },
    {
      id: "prod-01",
      name: "A - Ampolla Reestructurante",
      category_name: "Tratamientos",
      brand_name: "Nov",
      base_price: 3500,
      is_active: false, // Pausado
      stock: 12,
      variants: [{ sku: "SKU-001", stock: 12, variant_name: "Caja x12" }],
    },
    {
      id: "prod-02",
      name: "M - Máscara Ácida",
      category_name: "Cuidado Capilar",
      brand_name: "Nov",
      base_price: 9200,
      is_active: true,
      stock: 25,
      variants: [{ sku: "SKU-002", stock: 25, variant_name: "1000g" }],
    },
  ];

  it("renderiza correctamente las columnas clickeables y datos de productos", () => {
    render(<ProductsTable products={sampleProducts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("ID / SKU")).toBeInTheDocument();
    expect(screen.getByText("Producto")).toBeInTheDocument();
    expect(screen.getByText("Categoría & Marca")).toBeInTheDocument();
    expect(screen.getByText("Precios")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();

    expect(screen.getByText("A - Ampolla Reestructurante")).toBeInTheDocument();
    expect(screen.getByText("M - Máscara Ácida")).toBeInTheDocument();
    expect(screen.getByText("Z - Aceite de Argán Puro")).toBeInTheDocument();
  });

  it("ordena por Nombre en orden ascendente (A-Z) y descendente (Z-A) al clickear", () => {
    render(<ProductsTable products={sampleProducts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Por defecto inicia ordenado por nombre ascendente (A-Z)
    const rowsInitial = screen.getAllByRole("row").slice(1);
    expect(rowsInitial[0]).toHaveTextContent("A - Ampolla Reestructurante");
    expect(rowsInitial[2]).toHaveTextContent("Z - Aceite de Argán Puro");

    // Click en la cabecera 'Producto' para invertir a descendente (Z-A)
    const nameHeader = screen.getByText("Producto").closest("th");
    fireEvent.click(nameHeader);

    const rowsDesc = screen.getAllByRole("row").slice(1);
    expect(rowsDesc[0]).toHaveTextContent("Z - Aceite de Argán Puro");
    expect(rowsDesc[2]).toHaveTextContent("A - Ampolla Reestructurante");
  });

  it("ordena por Precio de menor a mayor y de mayor a menor al clickear", () => {
    render(<ProductsTable products={sampleProducts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const priceHeader = screen.getByText("Precios").closest("th");
    // Primer clic: precio ascendente (3500 -> 9200 -> 18000)
    fireEvent.click(priceHeader);

    const rowsAsc = screen.getAllByRole("row").slice(1);
    expect(rowsAsc[0]).toHaveTextContent("A - Ampolla Reestructurante"); // $3.500
    expect(rowsAsc[2]).toHaveTextContent("Z - Aceite de Argán Puro"); // $18.000

    // Segundo clic: precio descendente (18000 -> 9200 -> 3500)
    fireEvent.click(priceHeader);

    const rowsDesc = screen.getAllByRole("row").slice(1);
    expect(rowsDesc[0]).toHaveTextContent("Z - Aceite de Argán Puro");
    expect(rowsDesc[2]).toHaveTextContent("A - Ampolla Reestructurante");
  });

  it("ordena por Stock de menor a mayor para detectar productos por agotarse", () => {
    render(<ProductsTable products={sampleProducts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const stockHeader = screen.getByText("Stock").closest("th");
    // Primer clic: stock ascendente (2 u. -> 12 u. -> 25 u.)
    fireEvent.click(stockHeader);

    const rowsAsc = screen.getAllByRole("row").slice(1);
    expect(rowsAsc[0]).toHaveTextContent("Z - Aceite de Argán Puro"); // 2 u. (alerta de stock)
    expect(rowsAsc[2]).toHaveTextContent("M - Máscara Ácida"); // 25 u.
  });

  it("filtra reactivamente por pestañas de Estado (Activos, Pausados, Bajo Stock)", () => {
    render(<ProductsTable products={sampleProducts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // 1. Filtrar solo 'Activos' (debe ocultar A - Ampolla Reestructurante)
    const btnActivos = screen.getByRole("button", { name: /^activos$/i });
    fireEvent.click(btnActivos);

    expect(screen.queryByText("A - Ampolla Reestructurante")).not.toBeInTheDocument();
    expect(screen.getByText("M - Máscara Ácida")).toBeInTheDocument();
    expect(screen.getByText("Z - Aceite de Argán Puro")).toBeInTheDocument();

    // 2. Filtrar solo 'Pausados'
    const btnPausados = screen.getByRole("button", { name: /^pausados$/i });
    fireEvent.click(btnPausados);

    expect(screen.getByText("A - Ampolla Reestructurante")).toBeInTheDocument();
    expect(screen.queryByText("M - Máscara Ácida")).not.toBeInTheDocument();

    // 3. Filtrar 'Bajo Stock' (≤5 unidades)
    const btnBajoStock = screen.getByRole("button", { name: /bajo stock/i });
    fireEvent.click(btnBajoStock);

    expect(screen.getByText("Z - Aceite de Argán Puro")).toBeInTheDocument(); // Tiene 2 unidades
    expect(screen.queryByText("M - Máscara Ácida")).not.toBeInTheDocument(); // Tiene 25 unidades

    // 4. Volver a 'Todos'
    const btnTodos = screen.getByRole("button", { name: /todos/i });
    fireEvent.click(btnTodos);
    expect(screen.getAllByRole("row").slice(1)).toHaveLength(3);
  });
});
