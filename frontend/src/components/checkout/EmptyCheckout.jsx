import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCheckout() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-8 md:p-10 shadow-xl shadow-zinc-900/5">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#DE1B76]/10 border border-[#DE1B76]/20 flex items-center justify-center text-[#DE1B76]">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
          No hay productos agregados actualmente
        </h2>

        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-8">
          Tu carrito de compras se encuentra vacío. Explorá nuestro catálogo de belleza,
          peluquería y cuidado profesional para seleccionar tus productos antes de realizar el pago.
        </p>

        <Link
          href="/productos"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-[#DE1B76] hover:bg-[#c21464] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-[#DE1B76]/25 active:scale-[0.99]"
        >
          <span>Explorar Catálogo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
