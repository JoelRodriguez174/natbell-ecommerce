"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@heroui/react";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";
import CatalogBreadcrumbs from "@/components/product/CatalogBreadcrumbs";
import CatalogSortDropdown from "@/components/product/CatalogSortDropdown";
import CatalogEmptyState from "@/components/product/CatalogEmptyState";
import { getProducts, getCategories, getBrands } from "@/lib/api";
import { sanitizeQuery } from "@/lib/utils";

function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parámetros de la URL
  const q = sanitizeQuery(searchParams.get("q") || "");
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const sort = searchParams.get("sort") || "featured";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const onSale = searchParams.get("on_sale") === "true";

  // Queries reactivas: categorías y marcas disponibles según filtros
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", brand],
    queryFn: () => getCategories(brand ? { brand } : {}),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands", category],
    queryFn: () =>
      getBrands({
        ...(category ? { category } : {}),
        only_with_products: true,
      }),
  });

  const {
    data: productsData,
    isLoading: loadingProducts,
  } = useQuery({
    queryKey: [
      "products",
      { q, category, brand, minPrice, maxPrice, sort, page, onSale },
    ],
    queryFn: () =>
      getProducts({
        q: q || undefined,
        category: category || undefined,
        brand: brand || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort: sort || undefined,
        page,
        per_page: 12,
        on_sale: onSale ? true : undefined,
      }),
  });

  const products = productsData?.items || [];
  const totalItems =
    productsData?.pagination?.total_items ?? productsData?.total ?? products.length;
  const totalPages =
    productsData?.pagination?.total_pages ?? productsData?.total_pages ?? 1;

  // Actualiza los parámetros de la URL
  const handleFilterChange = useCallback((newFilters) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    router.push(`/productos?${current.toString()}`);
  }, [searchParams, router]);

  const handleResetFilters = useCallback(() => {
    router.push("/productos");
  }, [router]);

  // Nombres descriptivos para los encabezados y migas de pan
  const currentCategoryName =
    categories.find((c) => c.slug === category)?.name ||
    category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const currentBrandName =
    brands.find((b) => b.slug === brand)?.name ||
    brand.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const pageTitle = q
    ? `Resultados para "${q}"`
    : category
      ? onSale ? `${currentCategoryName} en Oferta` : currentCategoryName
      : brand
        ? onSale ? `${currentBrandName} en Oferta` : currentBrandName
        : onSale ? "Ofertas Especiales" : "Catálogo Completo";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* 1. Migas de pan y filtros activos */}
      <CatalogBreadcrumbs
        category={category}
        brand={brand}
        q={q}
        onSale={onSale}
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentCategoryName={currentCategoryName}
        currentBrandName={currentBrandName}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 2. Encabezado del Catálogo y Ordenamiento */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-rose-100/70 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Mostrando {products.length} de {totalItems} artículos disponibles
          </p>
        </div>

        <CatalogSortDropdown
          currentSort={sort}
          onSortChange={(newSort) => handleFilterChange({ sort: newSort, page: 1 })}
        />
      </div>

      {/* 3. Layout Principal: Filtros Laterales + Grilla de Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1 w-full sticky top-24">
          <ProductFilters
            filters={{ category, brand, min_price: minPrice, max_price: maxPrice, on_sale: onSale }}
            categories={categories}
            brands={brands}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </aside>

        <section className="lg:col-span-3 space-y-8">
          {products.length === 0 && !loadingProducts ? (
            <CatalogEmptyState
              emptyTitle="No encontramos productos con los filtros seleccionados"
              emptySubtitle="Intenta remover algunos filtros o buscar con términos más amplios."
              onResetFilters={handleResetFilters}
            />
          ) : (
            <>
              <ProductGrid products={products} isLoading={loadingProducts} />

              {/* Paginación interactiva */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-8 pb-4">
                  <Pagination
                    total={totalPages}
                    page={page}
                    onChange={(newPage) => {
                      handleFilterChange({ page: newPage });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    color="danger"
                    showControls
                    className="gap-2"
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
          Cargando catálogo de Natbell...
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}
