"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProductGrid from "@/components/product/ProductGrid";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    async function loadCategoryProducts() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/api/products?category=${slug}&per_page=40`);
        setProducts(data.items || []);
        if (data.items?.length > 0) {
          setCategoryName(
            data.items[0].subcategory?.category?.name || slug
          );
        } else {
          setCategoryName(slug.replace(/-/g, " "));
        }
      } catch (e) {
        console.error("Error loading category products:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryProducts();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Todos los productos</span>
        </Link>
      </div>

      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Categoría
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize mt-1">
          {categoryName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {products.length} {products.length === 1 ? "producto" : "productos"} disponibles
        </p>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        emptyMessage={`No hay productos disponibles actualmente en la categoría "${categoryName}".`}
      />
    </div>
  );
}
