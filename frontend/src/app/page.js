"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Tag,
  Star,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [featured, onSale, cats] = await Promise.all([
          apiFetch("/api/products/featured?limit=8").catch(() => []),
          apiFetch("/api/products/on-sale?limit=8").catch(() => []),
          apiFetch("/api/categories").catch(() => []),
        ]);

        if (Array.isArray(featured)) setFeaturedProducts(featured);
        if (Array.isArray(onSale)) setOnSaleProducts(onSale);
        if (Array.isArray(cats)) setCategories(cats);
      } catch (e) {
        console.error("Error loading home data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const sampleCategories = categories.length > 0 ? categories : [
    { name: "Coloración", slug: "coloracion", icon: "🎨" },
    { name: "Tratamientos", slug: "tratamientos-capilares", icon: "💆" },
    { name: "Shampoos", slug: "shampoos-y-acondicionadores", icon: "🧴" },
    { name: "Barbería", slug: "barberia", icon: "🧔" },
    { name: "Máquinas", slug: "maquinas-y-herramientas", icon: "✂️" },
    { name: "Accesorios", slug: "accesorios-de-peluqueria", icon: "🪮" },
  ];

  const brandLogos = [
    "Nov",
    "Plasma",
    "La Puissance",
    "Frilayp",
    "Beauty Color",
    "Yilho",
    "Eurostyl",
    "Jessamy",
    "Roubaix",
    "Duga",
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 lg:py-32">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider animate-in fade-in">
              <Sparkles size={14} />
              <span>Distribuidora Oficial • Los Arrayanes</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Insumos y Belleza{" "}
              <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300 bg-clip-text text-transparent">
                Profesional
              </span>{" "}
              para Salones y Barberías
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Más de 650 productos de primeras marcas argentinas e internacionales. Tinturas, oxidantes, máscaras capilares, máquinas de corte y accesorios con entrega a todo el país.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/productos">
                <Button variant="primary" size="lg" className="group">
                  <span>Explorar Catálogo</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </Link>
              <Link href="/productos?on_sale=true">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-slate-900/80 text-white border-slate-800 hover:bg-slate-800"
                >
                  <Tag size={16} className="text-emerald-400" />
                  <span>Ver Ofertas</span>
                </Button>
              </Link>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-800/80">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">+650</div>
                <div className="text-xs text-slate-400 mt-0.5">Productos en stock</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">25+</div>
                <div className="text-xs text-slate-400 mt-0.5">Marcas líderes</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">48/72h</div>
                <div className="text-xs text-slate-400 mt-0.5">Envíos a todo el país</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Categorías Principales
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Encontrá rápidamente todo lo que tu salón necesita.
            </p>
          </div>
          <Link
            href="/productos"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {sampleCategories.slice(0, 6).map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="group flex flex-col items-center justify-center text-center p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 group-hover:text-white text-rose-600 flex items-center justify-center text-xl mb-3 transition-colors">
                {cat.icon || "✨"}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Productos Destacados
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Los más elegidos por profesionales de la peluquería y barbería.
                </p>
              </div>
            </div>
            <Link
              href="/productos?featured=true"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id || prod.slug} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 4. CALLOUT PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Línea Técnica Profesional
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              Coloración, Decoloración & Oxidantes al Mejor Precio Mayorista
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Equipá tu salón con Nov, Plasma, Roubaix y La Puissance. Formatos individuales y bidones de 1900ml y 3900ml para máxima rentabilidad.
            </p>
            <div className="pt-2">
              <Link href="/categoria/coloracion">
                <Button variant="primary" size="md">
                  Ver productos de coloración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ON SALE PRODUCTS */}
      {onSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Tag size={20} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Ofertas del Mes
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Precios especiales en tratamientos, insumos y herramientas.
                </p>
              </div>
            </div>
            <Link
              href="/productos?on_sale=true"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Ver todas las ofertas</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {onSaleProducts.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id || prod.slug} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. BRANDS MARQUEE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Marcas que confían en nosotros
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {brandLogos.map((brand) => (
            <Link
              key={brand}
              href={`/marca/${brand.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm font-black text-slate-700 hover:text-rose-600 hover:border-rose-300 hover:shadow-sm transition-all"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
