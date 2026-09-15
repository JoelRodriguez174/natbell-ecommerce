"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@heroui/react";
import { ChevronDown, Check, X } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";
import { getProducts, getCategories, getBrands } from "@/lib/api";
import { sanitizeQuery, cn } from "@/lib/utils";

function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef(null);

  // Parámetros de la URL
  const q = sanitizeQuery(searchParams.get("q") || "");
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const sort = searchParams.get("sort") || "featured";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const onSale = searchParams.get("on_sale") === "true";

  // Queries dinámicas y reactivas:
  // Si se selecciona una marca, solo se traen las categorías que dicha marca proporciona.
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", brand],
    queryFn: () => getCategories(brand ? { brand } : {}),
  });

  // Si se selecciona una categoría, solo se traen las marcas que tienen productos en esa categoría.
  // Se requiere only_with_products: true para mostrar únicamente marcas con productos existentes en el catálogo.
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
  const handleFilterChange = (newFilters) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    router.push(`/productos?${current.toString()}`);
  };

  const handleResetFilters = () => {
    router.push("/productos");
  };

  const sortOptions = [
    { value: "featured", label: "Destacados" },
    { value: "newest", label: "Más recientes" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sort)?.label || "Destacados";

  // Cerrar dropdown de ordenamiento al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCategoryObj = categories.find((c) => c.slug === category);
  const currentCategoryName = currentCategoryObj?.name || category;

  const currentBrandObj = brands.find((b) => b.slug === brand);
  const currentBrandName = currentBrandObj?.name || brand;

  const emptyTitle = category
    ? `Categoría: ${currentCategoryName}`
    : q
      ? `No encontramos productos para "${q}"`
      : "No se encontraron productos";

  const emptyDescription = category
    ? "Pronto se agregarán más productos a esta categoría. ¡Estamos ampliando nuestro catálogo para vos!"
    : q
      ? "Intenta con términos más generales o verifica que las palabras estén bien escritas."
      : "Intenta ajustar tus filtros de búsqueda o seleccionar otra categoría.";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Navegación y Filtros estilo MercadoLibre (sin recuadros circulares) */}
      <nav aria-label="Ruta de filtros" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
        <Link
          href="/productos"
          className={cn(
            "hover:text-blue-600 transition-colors",
            !category && !brand && !q && !onSale ? "text-gray-900 font-semibold" : "text-gray-500"
          )}
        >
          Catálogo
        </Link>

        {onSale && (
          <>
            <span className="text-gray-400 select-none">&gt;</span>
            <div className="inline-flex items-center gap-1">
              <span className={cn(!category && !brand && !q ? "text-rose-600 font-semibold" : "text-gray-500")}>
                Ofertas
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange({ on_sale: undefined, page: 1 })}
                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar filtro de ofertas"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {category && (
          <>
            <span className="text-gray-400 select-none">&gt;</span>
            <div className="inline-flex items-center gap-1">
              <Link
                href={onSale ? `/productos?on_sale=true&category=${category}` : `/productos?category=${category}`}
                className={cn(
                  "hover:text-blue-600 transition-colors",
                  !brand && !q ? "text-blue-600 font-medium" : "text-gray-500"
                )}
              >
                {currentCategoryName}
              </Link>
              <button
                type="button"
                onClick={() => handleFilterChange({ category: undefined, page: 1 })}
                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar categoría"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {brand && (
          <>
            <span className="text-gray-400 select-none">&gt;</span>
            <div className="inline-flex items-center gap-1">
              <span className={cn(!q ? "text-blue-600 font-medium" : "text-gray-500")}>
                {currentBrandName}
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange({ brand: undefined, page: 1 })}
                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar marca"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {q && (
          <>
            <span className="text-gray-400 select-none">&gt;</span>
            <div className="inline-flex items-center gap-1">
              <span className="text-blue-600 font-medium">"{q}"</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ q: undefined, page: 1 })}
                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {(minPrice || maxPrice) && (
          <>
            <span className="text-gray-400 select-none">&gt;</span>
            <div className="inline-flex items-center gap-1">
              <span className="text-blue-600 font-medium">
                ${minPrice || 0} - ${maxPrice || "máx"}
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange({ min_price: undefined, max_price: undefined, page: 1 })}
                className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar filtro de precio"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {(category || brand || q || minPrice || maxPrice || onSale) && (
          <button
            onClick={handleResetFilters}
            className="ml-2 text-xs text-rose-600 hover:text-rose-700 underline underline-offset-2 cursor-pointer font-normal"
          >
            Limpiar filtros
          </button>
        )}
      </nav>

      {/* Header del Catálogo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {q
              ? `Resultados para "${q}"`
              : category
                ? onSale
                  ? `${currentCategoryName} en Oferta`
                  : currentCategoryName
                : brand
                  ? onSale
                    ? `${currentBrandName} en Oferta`
                    : currentBrandName
                  : onSale
                    ? "Ofertas Especiales"
                    : "Catálogo Completo"}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Mostrando {products.length} de {totalItems} artículos disponibles
          </p>
        </div>

        {/* Drop-down Ordenar por arriba a la derecha */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-800 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="text-gray-500 font-normal">Ordenar por:</span>
            <span className="font-bold text-gray-900">{currentSortLabel}</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-gray-500 transition-transform duration-150",
                sortDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-30 divide-y divide-gray-50 animate-in fade-in duration-100">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange({ sort: opt.value, page: 1 });
                    setSortDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                    sort === opt.value
                      ? "bg-gray-50 text-gray-950 font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  )}
                >
                  <span>{opt.label}</span>
                  {sort === opt.value && <Check className="w-3.5 h-3.5 text-black" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenido con Sidebar de Filtros */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ProductFilters
          categories={categories}
          brands={brands}
          selectedCategory={category}
          selectedBrand={brand}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onSale={onSale}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Grilla y Paginador */}
        <div className="flex-1 w-full space-y-8">
          <ProductGrid
            products={products}
            isLoading={loadingProducts}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyActionLabel={category ? "Ver todo el catálogo" : "Limpiar todos los filtros"}
            onResetFilters={handleResetFilters}
          />

          {/* Paginación con HeroUI Pagination Compound */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center pt-8 border-t border-gray-200">
              <Pagination className="flex items-center justify-center">
                <Pagination.Content className="flex items-center gap-1.5 list-none">
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 1}
                      onPress={() => handleFilterChange({ page: page - 1 })}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Anterior
                    </Pagination.Previous>
                  </Pagination.Item>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;

                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsis && (
                            <Pagination.Ellipsis className="text-gray-400 px-1 text-xs" />
                          )}
                          <Pagination.Item>
                            <Pagination.Link
                              isActive={page === p}
                              onPress={() => handleFilterChange({ page: p })}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors shadow-2xs ${page === p
                                  ? "bg-zinc-950 text-white font-bold"
                                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                              {p}
                            </Pagination.Link>
                          </Pagination.Item>
                        </div>
                      );
                    })}

                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages}
                      onPress={() => handleFilterChange({ page: page + 1 })}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Siguiente
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
          Cargando catálogo de Natbell...
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}
