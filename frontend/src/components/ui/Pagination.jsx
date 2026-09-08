"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {[...Array(totalPages)].map((_, i) => {
        const pageNum = i + 1;
        // Show limited pages if many
        if (
          totalPages > 7 &&
          pageNum !== 1 &&
          pageNum !== totalPages &&
          Math.abs(pageNum - currentPage) > 1
        ) {
          if (pageNum === 2 || pageNum === totalPages - 1) {
            return (
              <span key={pageNum} className="px-2 text-slate-400 text-xs">
                ...
              </span>
            );
          }
          return null;
        }

        const isActive = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
