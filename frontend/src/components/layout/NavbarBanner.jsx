import { Truck, CreditCard } from "lucide-react";

/**
 * Top bar de anuncios y beneficios comerciales del Navbar.
 */
export default function NavbarBanner() {
  return (
    <div className="bg-zinc-950 py-1.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs text-zinc-200 border-b border-zinc-850 flex items-center justify-center gap-2 sm:gap-4 overflow-hidden">
      <span className="inline-flex items-center gap-1.5 shrink-0">
        <Truck className="w-3.5 h-3.5 text-[#5EB82D] shrink-0" />
        <span>Envíos a todo el país</span>
      </span>
      <span className="text-zinc-650 shrink-0">•</span>
      <span className="inline-flex items-center gap-1.5 shrink-0">
        <CreditCard className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="hidden sm:inline">Hasta 6 cuotas con MercadoPago</span>
        <span className="sm:hidden">Hasta 6 cuotas</span>
      </span>
      <span className="text-zinc-650 hidden md:inline">•</span>
      <span className="text-zinc-300 hidden md:inline">
        Distribuidora Oficial de Belleza y Cosmética Capilar
      </span>
    </div>
  );
}
