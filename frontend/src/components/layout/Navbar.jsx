"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@heroui/react";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ChevronRight,
  Truck,
  CreditCard,
  Package,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CartDrawer from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/useCartStore";
import { searchProducts } from "@/lib/api";
import { sanitizeQuery, formatCurrency } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [pathname]);

  // Debounce para búsqueda en vivo
  useEffect(() => {
    const clean = sanitizeQuery(searchQuery);
    if (!clean || clean.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchProducts(clean, 5);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error("Error en búsqueda rápida:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cerrar dropdown al hacer click afuera de desktop o mobile search
  useEffect(() => {
    function handleClickOutside(e) {
      const insideDesktop = searchRef.current && searchRef.current.contains(e.target);
      const insideMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!insideDesktop && !insideMobile) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = sanitizeQuery(searchQuery);
    if (!clean) return;
    setShowDropdown(false);
    setMobileMenuOpen(false);
    router.push(`/productos?q=${encodeURIComponent(clean)}`);
  };

  const navCategories = [
    { label: "Inicio", href: "/" },
    { label: "Todo el Catálogo", href: "/productos" },
    { label: "Destacados", href: "/#destacados" },
    { label: "Ofertas", href: "/productos?on_sale=true" },
    { label: "Sobre Nosotros", href: "/sobre-nosotros" },
  ];

  // Componente renderizado de dropdown de búsqueda rápida (compartido desktop y móvil)
  const renderSearchResultsDropdown = () => {
    if (!showDropdown) return null;

    return (
      <Card className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
        <CardContent className="p-0">
          {isSearching ? (
            <div className="p-4 text-center text-xs text-gray-500">
              Buscando en el catálogo...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-72 sm:max-h-80 overflow-y-auto">
              {searchResults.map((item) => {
                const img = item.image_urls?.[0] || item.images?.[0] || `/products/${item.slug}.webp`;
                return (
                  <Link
                    key={item.id}
                    href={`/productos/${item.slug}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      {img ? (
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-gray-800 group-hover:text-black truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {item.brand_name || "NATBELL"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 shrink-0">
                      {formatCurrency(item.base_price)}
                    </div>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full py-2.5 px-4 text-center text-xs font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Ver todos los resultados para "{searchQuery}"</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              No encontramos productos para "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-xs">
      {/* Top Banner de beneficios compacto y responsivo */}
      <div className="bg-zinc-900 py-1.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs text-zinc-200 border-b border-zinc-800 flex items-center justify-center gap-2 sm:gap-4 overflow-hidden">
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Envíos a todo el país</span>
        </span>
        <span className="text-zinc-600 shrink-0">•</span>
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Hasta 6 cuotas con MercadoPago</span>
          <span className="sm:hidden">Hasta 6 cuotas</span>
        </span>
        <span className="text-zinc-600 hidden md:inline">•</span>
        <span className="text-zinc-300 hidden md:inline">
          Distribuidora Oficial de Belleza y Cosmética Capilar
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-2 sm:gap-6">
          {/* Brand Logo — strictly NATBELL */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black flex items-center justify-center text-white font-black text-base sm:text-lg tracking-tighter">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-gray-950 leading-none">
                NATBELL
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-gray-500 mt-0.5">
                Cosmética & Peluquería
              </span>
            </div>
          </Link>

          {/* Center Search Bar with Live Results Dropdown (Desktop) */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Buscar tinturas, decolorantes, shampoos, marcas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-black rounded-lg text-sm"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-zinc-900 hover:bg-black text-white px-4 py-2 text-xs font-semibold rounded-lg shrink-0"
              >
                Buscar
              </Button>
            </form>

            {/* Dropdown de Búsqueda Rápida Desktop */}
            {renderSearchResultsDropdown()}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Cart Trigger */}
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              title="Carrito de compras"
              aria-label="Ver carrito de compras"
              data-testid="navbar-cart-btn"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                <span
                  className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-xs"
                  data-testid="cart-badge"
                >
                  {mounted ? totalItems : 0}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-800 hidden md:inline">
                Mi Carrito
              </span>
            </button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Input with Dropdown (Smartphone) */}
        <div ref={mobileSearchRef} className="sm:hidden relative pb-2.5 pt-0.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-lg text-xs"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-zinc-900 hover:bg-black text-white px-3 py-2 text-xs font-semibold rounded-lg shrink-0"
            >
              Buscar
            </Button>
          </form>

          {/* Dropdown de Búsqueda Rápida Mobile */}
          {renderSearchResultsDropdown()}
        </div>
      </div>

      {/* Subnav con enlaces principales en Desktop */}
      <nav className="border-t border-gray-100 bg-gray-50/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-7 py-2.5 text-xs font-medium overflow-x-auto no-scrollbar">
            {navCategories.map((cat, idx) => {
              const isActive =
                cat.href === "/"
                  ? pathname === "/"
                  : pathname === cat.href || (cat.href.startsWith("/productos") && pathname?.startsWith("/productos") && cat.href === "/productos" && !pathname.includes("on_sale"));
              return (
                <Link
                  key={idx}
                  href={cat.href}
                  className={`whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-black font-bold"
                      : "text-gray-700 hover:text-black hover:font-semibold"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Slide Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg animate-in slide-in-from-top duration-200">
          <div className="py-3 px-4 space-y-1">
            {navCategories.map((cat, idx) => {
              const isActive =
                cat.href === "/"
                  ? pathname === "/"
                  : pathname === cat.href;
              return (
                <Link
                  key={idx}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-black font-semibold"
                      : "text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Footer Info */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/70 text-xs text-gray-500 space-y-2">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Envíos a todo el país • 6 cuotas sin interés</span>
            </div>
            <p className="text-[11px] text-gray-400">
              NATBELL — Distribuidora Oficial de Cosmética y Belleza Profesional
            </p>
          </div>
        </div>
      )}
      {/* Drawer lateral de Carrito */}
      <CartDrawer />
    </header>
  );
}

