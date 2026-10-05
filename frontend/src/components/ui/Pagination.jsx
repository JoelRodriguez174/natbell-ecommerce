"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente atómico de Paginación interactiva para Natbell.
 * Renderiza botones numéricos de páginas, accesos anterior/siguiente y elipsis adaptativa.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
  siblingCount = 1,
}) {
  if (totalPages <= 1) return null;

  // Genera el rango de páginas a mostrar con elipsis (...)
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, "...", ...middleRange, "...", totalPages];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page === currentPage || page === "..." || page < 1 || page > totalPages) {
      return;
    }
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Paginación de catálogo"
      className={cn("flex flex-wrap items-center justify-center gap-1.5 sm:gap-2", className)}
    >
      {/* Botón Anterior */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer",
          currentPage <= 1
            ? "border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed"
            : "border-gray-200/90 text-gray-700 bg-white hover:bg-rose-50/60 hover:text-[#DE1B76] hover:border-rose-200 active:scale-95 shadow-2xs"
        )}
        aria-label="Página anterior"
        data-testid="pagination-prev-btn"
      >
        <ChevronLeft className="w-4 h-4 shrink-0" />
      </button>

      {/* Lista de Números de Página */}
      <div className="flex items-center gap-1 sm:gap-1.5" data-testid="pagination-pages-list">
        {pages.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-400 select-none"
                aria-hidden="true"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }

          const pageNum = Number(item);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => handlePageClick(pageNum)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Página ${pageNum}`}
              data-testid={`pagination-page-${pageNum}`}
              className={cn(
                "min-w-8 h-8 sm:min-w-9 sm:h-9 px-2 flex items-center justify-center text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer",
                isActive
                  ? "bg-[#DE1B76] text-white border border-[#DE1B76] shadow-sm shadow-[#DE1B76]/25"
                  : "bg-white text-gray-700 border border-gray-200/90 hover:bg-rose-50/60 hover:text-[#DE1B76] hover:border-rose-200 active:scale-95 shadow-2xs"
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer",
          currentPage >= totalPages
            ? "border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed"
            : "border-gray-200/90 text-gray-700 bg-white hover:bg-rose-50/60 hover:text-[#DE1B76] hover:border-rose-200 active:scale-95 shadow-2xs"
        )}
        aria-label="Página siguiente"
        data-testid="pagination-next-btn"
      >
        <ChevronRight className="w-4 h-4 shrink-0" />
      </button>
    </nav>
  );
}
