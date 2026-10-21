import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck } from "lucide-react";

/**
 * 8 Marcas oficiales y empresas líderes comercializadas por Natbell.
 * Se distribuyen simétricamente 4 a la izquierda y 4 a la derecha.
 */
const LEFT_BRAND_LOGOS = [
  { name: "NOV", slug: "nov", logo: "/logos/nov.svg" },
  { name: "FRILAYP", slug: "frilayp", logo: "/logos/frilayp.svg" },
  { name: "EUROSTIL", slug: "eurostyl", logo: "/logos/eurostil.svg" },
  { name: "LA PUISSANCE", slug: "la-puissance", logo: "/logos/la-puissance.svg" },
];

const RIGHT_BRAND_LOGOS = [
  { name: "PLASMA", slug: "plasma", logo: "/logos/plasma.svg" },
  { name: "PLAYCOLOR", slug: "playcolor", logo: "/logos/playcolor.svg" },
  { name: "DUGA", slug: "duga", logo: "/logos/duga.svg" },
  { name: "JESSAMY", slug: "jessamy", logo: "/logos/jessamy.svg" },
];

const ALL_BRAND_LOGOS = [...LEFT_BRAND_LOGOS, ...RIGHT_BRAND_LOGOS];

/**
 * Tarjeta individual glassmorphic para logo de empresa/marca.
 */
function BrandLogoCard({ brand }) {
  return (
    <Link
      href={`/productos?brand=${brand.slug}`}
      title={`Ver productos ${brand.name}`}
      className="group relative w-full max-w-[190px] xl:max-w-[210px] px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.13] backdrop-blur-md border border-rose-500/25 hover:border-[#DE1B76] shadow-[0_4px_20px_rgba(222,27,118,0.15)] hover:shadow-[0_8px_32px_rgba(222,27,118,0.40)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative w-full h-8 flex items-center justify-center">
        <Image
          src={brand.logo}
          alt={`Logo oficial de ${brand.name}`}
          width={150}
          height={38}
          className="object-contain max-h-8 w-auto brightness-95 group-hover:brightness-110 group-hover:scale-105 transition-all duration-300"
        />
      </div>
    </Link>
  );
}

/**
 * Hero Banner principal de la página de inicio.
 * Presenta fondo fotográfico de salón de belleza profesional con atmósfera
 * oscura de alta intensidad en rosa (estética cosmética de belleza), iluminación
 * fucsia/magenta envolvente y logos de las empresas y marcas líderes a los costados.
 */
export default function HomeHeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#180312] via-[#0d0208] to-[#070104] text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#DE1B76]/30 shadow-[0_10px_40px_rgba(222,27,118,0.20)]">
      {/* 1. Fotografía de salón de belleza de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/img/hero-salon-bg.jpg"
          alt="Ambiente de salón de peluquería profesional Natbell"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-25 mix-blend-luminosity"
        />
        {/* Overlay degradé oscuro con tinte rosa/fucsia profundo para maximizar contraste y elegancia */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c0316]/90 via-[#0e020a]/85 to-[#070104]/95" />
      </div>

      {/* 2. Iluminación rosa de alta intensidad (Aura & Glow envolvente estilo páginas de belleza) */}
      {/* Halo radial superior central */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[800px] h-[480px] bg-gradient-to-b from-[#DE1B76]/50 via-[#DE1B76]/20 to-transparent blur-[110px] rounded-full pointer-events-none z-0" />

      {/* Luces laterales rosa fucsia que enmarcan las columnas de logos */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#DE1B76]/35 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#DE1B76]/35 blur-[120px] pointer-events-none z-0" />

      {/* Halo central difuso rosa profundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-72 rounded-full bg-rose-600/15 blur-[130px] pointer-events-none z-0" />

      {/* Toque verde lima muy sutil para harmonizar con el logo */}
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-[#5EB82D]/12 blur-3xl pointer-events-none z-0" />

      {/* 3. Contenedor principal: Logos a los costados y contenido central en desktop */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Columna Izquierda: Logos de Empresas (Desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-3.5 items-end justify-center">
            {LEFT_BRAND_LOGOS.map((brand) => (
              <BrandLogoCard key={brand.slug} brand={brand} />
            ))}
          </div>

          {/* Columna Central: Mensaje, Títulos y CTAs */}
          <div className="lg:col-span-6 text-center space-y-6">
            {/* Badge promocional de Envío Gratis */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-[#DE1B76]/40 text-rose-200 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-[0_0_20px_rgba(222,27,118,0.25)] animate-in fade-in">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Envío Sin Cargo en compras superiores a $30.000!</span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
                <span className="bg-gradient-to-r from-rose-400 via-[#DE1B76] to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(222,27,118,0.4)]">
                  NATBELL
                </span>
              </h1>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-100 uppercase leading-snug max-w-2xl mx-auto">
                <span>PRODUCTOS PROFESIONALES A PRECIOS MAYORISTAS</span>
                <span className="block text-sm sm:text-lg lg:text-xl font-medium text-rose-200/80 mt-1 sm:mt-1.5">
                  ENCONTRÁ TODO LO QUE NECESITÁS PARA TU NEGOCIO
                </span>
              </h2>
            </div>

            <p className="text-sm sm:text-base text-zinc-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs">
              Comprá directo tinturas, decolorantes, máquinas de corte y tratamientos de marcas líderes.
              Stock real inmediato con envíos sin cargo desde $30.000 a todo el país y cuotas con MercadoPago.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2.5 bg-[#DE1B76] hover:bg-[#c21464] text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-[0_4px_24px_rgba(222,27,118,0.5)] hover:shadow-[0_6px_30px_rgba(222,27,118,0.7)] transition-all active:scale-[0.98]"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link
                href="/productos?on_sale=true"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-rose-400/40 hover:border-[#DE1B76] transition-all backdrop-blur-md shadow-sm"
              >
                <span>Ver Ofertas Especiales</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Logos de Empresas (Desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-3.5 items-start justify-center">
            {RIGHT_BRAND_LOGOS.map((brand) => (
              <BrandLogoCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </div>

        {/* 4. Showcase de Logos en Mobile y Tablet (< lg) */}
        <div className="lg:hidden mt-8 pt-6 border-t border-rose-500/25">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ALL_BRAND_LOGOS.map((brand) => (
              <BrandLogoCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
