"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  Sparkles,
  Tag,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import MobileMenu from "./MobileMenu";
import CartDrawer from "../cart/CartDrawer";
import { apiFetch } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const { totalItems, openDrawer } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Fetch categories for menu
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiFetch("/api/categories");
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (e) {
        // Fallback main categories if API not running yet
        setCategories([
          { name: "Coloración", slug: "coloracion" },
          { name: "Tratamientos Capilares", slug: "tratamientos-capilares" },
          { name: "Shampoos y Acondicionadores", slug: "shampoos-y-acondicionadores" },
          { name: "Barbería", slug: "barberia" },
          { name: "Máquinas y Herramientas", slug: "maquinas-y-herramientas" },
          { name: "Accesorios de Peluquería", slug: "accesorios-de-peluqueria" },
        ]);
      }
    }
    loadCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      {/* Top Banner Announcement */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide">
        <span className="opacity-90">
          ✨ Distribuidora de Belleza y Peluquería Profesional • Envíos a todo el país • Compra protegida
        </span>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-rose-500/30">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                  LOS <span className="text-rose-600">ARRAYANES</span>
                </span>
                <span className="text-[9px] tracking-widest text-slate-400 font-bold uppercase mt-0.5">
                  Belleza & Peluquería
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link
                href="/productos"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50/50 transition-colors"
              >
                Catálogo
              </Link>

              {/* Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50/50 transition-colors"
                >
                  <span>Categorías</span>
                  <ChevronDown size={14} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-64 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="grid gap-0.5">
                      {categories.slice(0, 8).map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/categoria/${cat.slug}`}
                          className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <Link
                          href="/productos"
                          className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl block transition-colors"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        >
                          Ver todas las categorías →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/productos?featured=true"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50/50 transition-colors"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Destacados</span>
              </Link>

              <Link
                href="/productos?on_sale=true"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-xl bg-emerald-50/80 transition-colors"
              >
                <Tag size={14} className="text-emerald-600" />
                <span>Ofertas</span>
              </Link>
            </nav>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-xs sm:max-w-sm relative hidden md:block"
            >
              <input
                type="text"
                placeholder="Buscar tinturas, oxidantes, máquinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-full pl-9 pr-4 py-2 sm:py-2.5 outline-none border border-transparent focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all placeholder:text-slate-400"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </form>

            {/* Right Actions: Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={openDrawer}
                className="relative flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all active:scale-95"
                aria-label="Abrir carrito de compras"
              >
                <ShoppingBag size={18} />
                <span className="hidden sm:inline text-xs font-bold">Carrito</span>
                {totalItems > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black shrink-0 animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 text-xs text-slate-900 rounded-full pl-9 pr-4 py-2 outline-none border border-transparent focus:border-rose-400"
              />
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Cart Drawer & Mobile Menu Overlays */}
      <CartDrawer />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
      />
    </>
  );
}
