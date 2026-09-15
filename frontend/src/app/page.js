"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Flame,
  Scissors,
  Droplets,
  Palette,
  Package,
  Truck,
  CreditCard,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  Zap,
  Eye,
  Waves,
  Brush,
  Layers,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ProductGrid from "@/components/product/ProductGrid";
import {
  getFeaturedProducts,
  getOnSaleProducts,
  getBrands,
  getCategories,
} from "@/lib/api";

function getCategoryIcon(slug) {
  switch (slug) {
    case "coloracion":
      return <Palette className="w-5 h-5 text-rose-600" />;
    case "tratamientos-capilares":
      return <Sparkles className="w-5 h-5 text-purple-600" />;
    case "shampoos-y-acondicionadores":
      return <Droplets className="w-5 h-5 text-blue-600" />;
    case "styling-fijacion":
      return <Flame className="w-5 h-5 text-amber-600" />;
    case "barberia":
      return <Scissors className="w-5 h-5 text-zinc-700" />;
    case "maquinas-y-herramientas":
      return <Zap className="w-5 h-5 text-yellow-600" />;
    case "accesorios-de-peluqueria":
      return <Package className="w-5 h-5 text-emerald-600" />;
    case "pestanas-y-cejas":
      return <Eye className="w-5 h-5 text-pink-600" />;
    case "descartables-e-higiene":
      return <ShieldCheck className="w-5 h-5 text-teal-600" />;
    case "unas-y-manicuria":
      return <Brush className="w-5 h-5 text-rose-500" />;
    case "ondulacion":
      return <Waves className="w-5 h-5 text-indigo-600" />;
    default:
      return <Layers className="w-5 h-5 text-zinc-600" />;
  }
}

export default function HomePage() {
  const router = useRouter();

  const { data: featuredProducts = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => getFeaturedProducts(8),
  });

  const { data: onSaleProducts = [], isLoading: loadingOnSale } = useQuery({
    queryKey: ["products", "onSale"],
    queryFn: () => getOnSaleProducts(8),
  });

  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands({ only_with_products: true }),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  return (
    <div className="flex flex-col space-y-10 sm:space-y-14 pb-16">
      {/* Hero Banner Comercial estilo Ossono / MercadoLibre */}
      <section className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-200 text-xs font-semibold tracking-wide">
              <span>Distribuidora Oficial de Belleza y Cosmética Capilar</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Productos profesionales para tu salón al mejor precio
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-xl font-normal leading-relaxed">
              Comprá directo tinturas, decolorantes, máquinas de corte y tratamientos de marcas líderes. Stock real inmediato con envíos a todo el país y cuotas con MercadoPago.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] border-2 border-white"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </Link>
              <Link
                href="/productos?on_sale=true"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-zinc-700 transition-all hover:border-zinc-500"
              >
                <span>Ver Ofertas Especiales</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-center">
            {/* Destacado visual comercial con foto real */}
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xs flex flex-col items-center text-center space-y-4 shadow-xl">
              <div className="w-full h-56 bg-white rounded-xl p-4 flex items-center justify-center shadow-md">
                <img
                  src="/products/nov-tintura-en-crema-profesional-60g.webp"
                  alt="Nov Tintura Profesional"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  OFERTA DESTACADA
                </span>
                <h3 className="text-lg font-bold text-white">
                  Línea Nov Coloración Profesional
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cobertura 100% canas • Brillo de salón • Precios por mayor y menor
                </p>
              </div>
              <Link
                href="/productos?category=coloracion"
                className="w-full bg-white text-zinc-950 font-bold py-2.5 rounded-xl text-xs hover:bg-zinc-100 transition-colors text-center"
              >
                Ver línea de coloración
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ribbon de Beneficios de Compra (CompraGamer / MercadoLibre) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-2xs">
            <CreditCard className="w-6 h-6 text-zinc-800 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-snug">3 y 6 Cuotas Fijas</p>
              <p className="text-[11px] text-gray-500">Con todas las tarjetas</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-2xs">
            <Truck className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-snug">Envíos a Todo el País</p>
              <p className="text-[11px] text-gray-500">Correo Argentino y Andreani</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-blue-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-snug">100% Originales</p>
              <p className="text-[11px] text-gray-500">Garantía de distribuidora</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-2xs">
            <PhoneCall className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-snug">Atención a Salones</p>
              <p className="text-[11px] text-gray-500">Asesoramiento por WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cuadrícula de Categorías Principales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Categorías Principales
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Encontrá rápidamente lo que necesitás para tu trabajo diario
            </p>
          </div>
          <Link
            href="/productos"
            className="text-xs font-semibold text-zinc-900 hover:text-black flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg" />
                  <Skeleton className="w-10 sm:w-14 h-3 sm:h-4 rounded-full" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="h-3.5 sm:h-4 w-3/4 rounded" />
                  <Skeleton className="h-2.5 sm:h-3 w-full rounded" />
                  <Skeleton className="h-2.5 sm:h-3 w-2/3 rounded" />
                </div>
                <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24 rounded pt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link
                key={c.id || c.slug}
                href={`/productos?category=${c.slug}`}
                className="group bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-2.5 sm:space-y-4"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    {getCategoryIcon(c.slug)}
                  </div>
                  {c.subcategories && c.subcategories.length > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                      {c.subcategories.length} {c.subcategories.length === 1 ? "línea" : "líneas"}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-black line-clamp-1 sm:line-clamp-none">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Explorar</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Shelf 1: Ofertas Destacadas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Ofertas de la Semana
              </h2>
              <p className="text-xs text-gray-500">
                Precios promocionales por tiempo limitado
              </p>
            </div>
          </div>
          <Link
            href="/productos?on_sale=true"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>Ver todas las ofertas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid
          products={onSaleProducts.length > 0 ? onSaleProducts : featuredProducts.slice(0, 4)}
          isLoading={loadingOnSale && loadingFeatured}
        />
      </section>

      {/* Carrusel / Grilla de Marcas Oficiales */}
      <section className="bg-white border-y border-gray-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
              Marcas Líderes en Distribución Oficial
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-center gap-2 sm:gap-3">
            {loadingBrands ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full md:w-28 rounded-lg" />
              ))
            ) : (
              brands.map((b) => (
                <Link
                  key={b.id || b.slug}
                  href={`/productos?brand=${b.slug}`}
                  className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-800 transition-colors shadow-2xs text-center truncate w-full md:w-auto block"
                  title={b.name}
                >
                  {b.name}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Shelf 2: Los Más Elegidos para el Salón (Destacados) */}
      <section id="destacados" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 scroll-mt-28">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Los Más Elegidos del Salón
            </h2>
            <p className="text-xs text-gray-500">
              Insumos y herramientas esenciales preferidos por estilistas
            </p>
          </div>
          <Link
            href="/productos"
            className="text-xs font-semibold text-zinc-900 hover:text-black flex items-center gap-1"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid
          products={featuredProducts}
          isLoading={loadingFeatured}
        />
      </section>

      {/* Banner de Asesoramiento para Salones y Venta Mayorista */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white rounded-2xl p-6 sm:p-10 lg:p-12 border border-zinc-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-left flex-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Venta Mayorista & Salones
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              ¿Tenés una peluquería, barbería o centro de estética?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Accedé a listas de precios preferenciales para profesionales, asesoramiento técnico directo, compras por bulto cerrado y reposición periódica con facturación A y B.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-zinc-300 justify-center lg:justify-start">
              <span className="flex items-center gap-1.5 font-medium">✓ Descuentos por volumen</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Factura A y B</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Envíos express a todo el país</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Asistencia técnica personalizada</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="https://wa.me/5491100000000?text=Hola%20Natbell,%20quisiera%20consultar%20por%20compras%20mayoristas"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3.5 rounded-xl shadow-lg w-full text-sm"
              >
                Consultar por WhatsApp
              </Button>
            </a>
            <Link href="/productos" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-8 py-3.5 rounded-xl w-full text-sm border border-zinc-200"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
