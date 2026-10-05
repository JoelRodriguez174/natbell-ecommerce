import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/ui/Pagination";

describe("Pagination Component", () => {
  it("no renderiza nada si totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza todos los números de página cuando totalPages es pequeño", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />
    );

    expect(screen.getByTestId("pagination-page-1")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-2")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-3")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-5")).toBeInTheDocument();
  });

  it("marca aria-current='page' en la página activa", () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />
    );

    const activePage = screen.getByTestId("pagination-page-3");
    expect(activePage).toHaveAttribute("aria-current", "page");

    const inactivePage = screen.getByTestId("pagination-page-2");
    expect(inactivePage).not.toHaveAttribute("aria-current");
  });

  it("deshabilita el botón Anterior en la página 1", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />
    );

    const prevBtn = screen.getByTestId("pagination-prev-btn");
    expect(prevBtn).toBeDisabled();

    const nextBtn = screen.getByTestId("pagination-next-btn");
    expect(nextBtn).not.toBeDisabled();
  });

  it("deshabilita el botón Siguiente en la última página", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />
    );

    const prevBtn = screen.getByTestId("pagination-prev-btn");
    expect(prevBtn).not.toBeDisabled();

    const nextBtn = screen.getByTestId("pagination-next-btn");
    expect(nextBtn).toBeDisabled();
  });

  it("dispara onPageChange con el número correcto al hacer clic", () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />
    );

    fireEvent.click(screen.getByTestId("pagination-page-4"));
    expect(handlePageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByTestId("pagination-next-btn"));
    expect(handlePageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByTestId("pagination-prev-btn"));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });
});
