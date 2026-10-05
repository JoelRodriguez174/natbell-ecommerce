import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck } from "lucide-react";

/**
 * Hero Banner principal de la página de inicio.
 * Presenta fondo fotográfico de salón de belleza profesional con la estética
 * del logo oficial de Natbell y contraste cinematográfico de alta legibilidad.
 */
export default function HomeHeroBanner() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-rose-950/40">
      {/* Fotografía de salón de belleza de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/img/hero-salon-bg.jpg"
          alt="Ambiente de salón de peluquería profesional Natbell"
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-center opacity-30"
        />
        {/* Overlay oscuro para garantizar legibilidad óptima de los textos y botones */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/95" />
      </div>

      {/* Luces de ambiente sutiles con colores Natbell */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#DE1B76]/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-[#5EB82D]/15 blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Badge promocional de Envío Gratis */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-xs shadow-xs animate-in fade-in">
          <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Envío Sin Cargo en compras superiores a $60.000!</span>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
            <span className="bg-linear-to-r from-[#DE1B76] via-rose-400 to-[#5EB82D] bg-clip-text text-transparent drop-shadow-sm">
              NATBELL
            </span>
          </h1>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-100 uppercase leading-snug max-w-3xl mx-auto">
            <span>PRODUCTOS PROFESIONALES A PRECIOS MAYORISTAS</span>
            <span className="block text-sm sm:text-lg lg:text-xl font-medium text-zinc-400 mt-1 sm:mt-1.5">
              ENCONTRÁ TODO LO QUE NECESITÁS PARA TU NEGOCIO
            </span>
          </h2>
        </div>

        <p className="text-sm sm:text-base text-zinc-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs">
          Comprá directo tinturas, decolorantes, máquinas de corte y tratamientos de marcas líderes.
          Stock real inmediato con envíos sin cargo desde $60.000 a todo el país y cuotas con MercadoPago.
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
            className="inline-flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-zinc-700 hover:border-rose-400/50 transition-all backdrop-blur-xs"
          >
            <span>Ver Ofertas Especiales</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
