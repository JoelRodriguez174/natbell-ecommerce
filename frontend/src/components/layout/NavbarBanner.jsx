import { Truck, CreditCard } from "lucide-react";

/**
 * Top bar de anuncios y beneficios comerciales del Navbar.
 */
export default function NavbarBanner() {
  return (
    <div className="bg-zinc-950 py-2.5 sm:py-3 px-3 sm:px-6 text-center text-xs sm:text-sm text-zinc-200 border-b border-zinc-800 flex items-center justify-center gap-3 sm:gap-6 overflow-hidden shadow-xs">
      <span className="inline-flex items-center gap-2 shrink-0 font-medium">
        <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#5EB82D] shrink-0" />
        <span className="tracking-wide">
          <strong className="text-white font-extrabold uppercase">Envíos Sin Cargo</strong> en compras desde{" "}
          <strong className="text-[#5EB82D] font-extrabold">$60.000</strong> a todo el país
        </span>
      </span>
      <span className="text-zinc-700 shrink-0 hidden sm:inline">•</span>
      <span className="inline-flex items-center gap-1.5 shrink-0 text-zinc-300 hidden sm:inline-flex">
        <CreditCard className="w-4 h-4 text-rose-400 shrink-0" />
        <span>Hasta 6 cuotas con MercadoPago</span>
      </span>
      <span className="text-zinc-700 hidden lg:inline">•</span>
      <span className="text-zinc-400 hidden lg:inline text-xs">
        Distribuidora Oficial de Belleza y Cosmética Capilar
      </span>
    </div>
  );
}
