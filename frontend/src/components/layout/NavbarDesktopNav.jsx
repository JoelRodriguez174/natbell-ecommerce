"use client";

import Link from "next/link";
import { Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Subbarra de navegación horizontal de escritorio con categorías y enlaces clave.
 */
export default function NavbarDesktopNav({ navCategories = [], currentPath = "" }) {
  if (!navCategories || navCategories.length === 0) return null;

  return (
    <nav
      aria-label="Navegación principal de escritorio"
      className="border-t border-rose-100/70 bg-gradient-to-r from-rose-50/20 via-white to-rose-50/20 hidden md:block shadow-2xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8 py-2.5 text-xs font-semibold overflow-x-auto no-scrollbar">
          {navCategories.map((item) => {
            const isHome = item.href === "/" && currentPath === "/";
            const isCatalog =
              item.href === "/productos" &&
              currentPath?.startsWith("/productos") &&
              !currentPath.includes("on_sale");
            const isExact = currentPath === item.href;
            const isActive = isHome || isCatalog || isExact;
            const isOffers = item.label.toLowerCase().includes("oferta");
            const isFeatured = item.label.toLowerCase().includes("destacado");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 py-1 transition-all whitespace-nowrap group",
                  isActive
                    ? "text-[#DE1B76] font-bold"
                    : "text-zinc-700 hover:text-[#DE1B76]"
                )}
              >
                {isFeatured && <Sparkles className="w-3.5 h-3.5 text-[#5EB82D]" />}
                {isOffers && <Flame className="w-3.5 h-3.5 text-amber-500" />}

                <span>{item.label}</span>

                {isOffers && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#DE1B76] text-white text-[9px] font-black uppercase tracking-wider">
                    Sale
                  </span>
                )}

                {/* Subrayado indicador activo */}
                <span
                  className={cn(
                    "absolute -bottom-2.5 left-0 w-full h-[2px] rounded-full transition-transform duration-200",
                    isActive
                      ? "bg-[#DE1B76] scale-x-100"
                      : "bg-[#DE1B76] scale-x-0 group-hover:scale-x-100 opacity-60"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
