"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import HomeHeroBanner from "@/components/home/HomeHeroBanner";
import HomeBenefitsRibbon from "@/components/home/HomeBenefitsRibbon";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeBrandsRibbon from "@/components/home/HomeBrandsRibbon";
import HomeWholesaleBanner from "@/components/home/HomeWholesaleBanner";
import {
  getFeaturedProducts,
  getOnSaleProducts,
  getBrands,
  getCategories,
} from "@/lib/api";

export default function HomePage() {
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
      {/* 1. Hero Principal con iluminación oficial Natbell */}
      <HomeHeroBanner />

      {/* 2. Ribbon de Beneficios de Compra */}
      <HomeBenefitsRibbon />

      {/* 3. Cuadrícula de Categorías Principales */}
      <HomeCategoryGrid categories={categories} isLoading={loadingCategories} />

      {/* 4. Shelf: Ofertas Destacadas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100/70 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#DE1B76]" />
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
            className="text-xs font-bold text-[#DE1B76] hover:text-[#c21464] flex items-center gap-1 transition-colors"
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

      {/* 5. Carrusel / Grilla de Marcas Oficiales */}
      <HomeBrandsRibbon brands={brands} isLoading={loadingBrands} />

      {/* 6. Shelf: Los Más Elegidos para el Salón (Destacados) */}
      <section id="destacados" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 scroll-mt-28">
        <div className="flex items-center justify-between border-b border-rose-100/70 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#5EB82D]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Los Más Elegidos del Salón
              </h2>
              <p className="text-xs text-gray-500">
                Insumos y herramientas esenciales preferidos por estilistas
              </p>
            </div>
          </div>
          <Link
            href="/productos"
            className="text-xs font-bold text-gray-800 hover:text-[#DE1B76] flex items-center gap-1 transition-colors"
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

      {/* 7. Banner de Asesoramiento para Salones y Venta Mayorista */}
      <HomeWholesaleBanner />
    </div>
  );
}
