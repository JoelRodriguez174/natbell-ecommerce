import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menú de navegación lateral/desplegable para dispositivos móviles en Navbar.
 */
export default function NavbarMobileMenu({
  isOpen,
  navCategories = [],
  currentPath = "",
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-rose-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
      <div className="flex flex-col space-y-1">
        {navCategories.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/" && currentPath?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors",
                isActive
                  ? "bg-rose-50 text-[#DE1B76] font-bold"
                  : "text-gray-700 hover:bg-gray-50 hover:text-black"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-[#DE1B76]" : "text-gray-400"
                )}
              />
            </Link>
          );
        })}
      </div>

      <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">
          Natbell — Distribuidora Oficial de Belleza
        </p>
        <p>Venta mayorista y minorista a todo el país.</p>
      </div>
    </div>
  );
}
