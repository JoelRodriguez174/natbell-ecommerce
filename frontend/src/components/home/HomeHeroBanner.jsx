import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Hero Banner principal de la página de inicio.
 * Diseñado con la atmósfera y paleta oficial de Natbell:
 * destellos sutiles fucsia/magenta (#DE1B76) y verde hoja (#5EB82D).
 */
export default function HomeHeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-[#181116] to-zinc-950 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-rose-950/40">
      {/* Luces de ambiente sutiles con colores Natbell */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#DE1B76]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-[#5EB82D]/12 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-200 border border-rose-500/20 text-xs font-semibold tracking-wide backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#5EB82D]" />
          <span>Distribuidora Oficial de Belleza y Cosmética Capilar</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
          Productos profesionales para tu salón al{" "}
          <span className="bg-gradient-to-r from-[#DE1B76] via-rose-400 to-[#5EB82D] bg-clip-text text-transparent">
            mejor precio
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Comprá directo tinturas, decolorantes, máquinas de corte y tratamientos de marcas líderes.
          Stock real inmediato con envíos a todo el país y cuotas con MercadoPago.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2.5 bg-[#DE1B76] hover:bg-[#c21464] text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg hover:shadow-[#DE1B76]/25 transition-all active:scale-[0.98]"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          <Link
            href="/productos?on_sale=true"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-zinc-700 hover:border-rose-400/50 transition-all"
          >
            <span>Ver Ofertas Especiales</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
