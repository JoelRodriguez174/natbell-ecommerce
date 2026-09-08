"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";
import Pagination from "@/components/ui/Pagination";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters state from URL or defaults
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  // Update URL search parameters
  const updateQuery = useCallback(
    (newParams) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });
      // reset page to 1 when changing filters other than page
      if (!newParams.page) {
        current.set("page", "1");
      }
      router.push(`/productos?${current.toString()}`);
    },
    [searchParams, router]
  );

  // Fetch products
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (category) queryParams.set("category", category);
        if (brand) queryParams.set("brand", brand);
        if (q) queryParams.set("q", q);
        if (sort) queryParams.set("sort", sort);
        if (minPrice) queryParams.set("min_price", minPrice);
        if (maxPrice) queryParams.set("max_price", maxPrice);
        queryParams.set("page", page.toString());
        queryParams.set("per_page", "16");

        const data = await apiFetch(`/api/products?${queryParams.toString()}`);
        setProducts(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      } catch (e) {
        console.error("Error loading products:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [category, brand, q, sort, page, minPrice, maxPrice]);

  // Load categories and brands for filters
  useEffect(() => {
    async function loadFilterMeta() {
      try {
        const [cats, brs] = await Promise.all([
          apiFetch("/api/categories").catch(() => []),
          apiFetch("/api/brands").catch(() => []),
        ]);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(brs)) setBrands(brs);
      } catch (e) {
        console.error("Error loading filter metadata:", e);
      }
    }
    loadFilterMeta();
  }, []);

  const handleFilterChange = (key, value) => {
    updateQuery({ [key]: value });
  };

  const handleResetFilters = () => {
    router.push("/productos");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Title & Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {q && `Resultados para "${q}" • `}
            {total} {total === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>

        {/* Sort & Filter controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs"
          >
            <SlidersHorizontal size={14} />
            <span>Filtros</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid & Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24">
          <ProductFilters
            categories={categories}
            brands={brands}
            selectedCategory={category}
            selectedBrand={brand}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </aside>

        {/* Mobile Filters Dropdown */}
        {isMobileFilterOpen && (
          <div className="lg:hidden col-span-12 mb-4">
            <ProductFilters
              categories={categories}
              brands={brands}
              selectedCategory={category}
              selectedBrand={brand}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}

        {/* Products Grid */}
        <section className="lg:col-span-9 flex flex-col justify-between">
          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => updateQuery({ page: p.toString() })}
              />
            </div>
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
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          Cargando catálogo...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
