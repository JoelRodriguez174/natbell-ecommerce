"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import NatbellLogo from "@/components/ui/NatbellLogo";
import CartDrawer from "@/components/cart/CartDrawer";
import NavbarBanner from "@/components/layout/NavbarBanner";
import NavbarSearchDropdown from "@/components/layout/NavbarSearchDropdown";
import NavbarMobileMenu from "@/components/layout/NavbarMobileMenu";
import { useCartStore } from "@/store/useCartStore";
import { searchProducts } from "@/lib/api";
import { sanitizeQuery } from "@/lib/utils";

const NAV_CATEGORIES = [
  { label: "Inicio", href: "/" },
  { label: "Todo el Catálogo", href: "/productos" },
  { label: "Destacados", href: "/#destacados" },
  { label: "Ofertas", href: "/productos?on_sale=true" },
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
];

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

  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const clean = sanitizeQuery(searchQuery);
    if (!clean) return;
    setShowDropdown(false);
    setMobileMenuOpen(false);
    router.push(`/productos?q=${encodeURIComponent(clean)}`);
  }, [searchQuery, router]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-100/60 bg-white/95 backdrop-blur-md shadow-2xs">
      <NavbarBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-17 md:h-19 gap-2 sm:gap-6">
          {/* Logo oficial Natbell */}
          <Link href="/" className="shrink-0 transition-transform active:scale-95" aria-label="Natbell Inicio">
            <NatbellLogo size="md" />
          </Link>

          {/* Buscador Desktop con Dropdown */}
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
                  className="bg-gray-50/70 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#DE1B76] rounded-xl text-sm"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-zinc-900 hover:bg-[#DE1B76] text-white px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition-colors"
              >
                Buscar
              </Button>
            </form>

            <NavbarSearchDropdown
              show={showDropdown}
              isSearching={isSearching}
              results={searchResults}
              searchQuery={searchQuery}
              onSelectResult={() => setShowDropdown(false)}
              onSubmitAll={handleSearchSubmit}
            />
          </div>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center gap-2 p-2 rounded-xl text-gray-700 hover:text-[#DE1B76] hover:bg-rose-50/50 transition-colors cursor-pointer"
              title="Carrito de compras"
              aria-label="Ver carrito de compras"
              data-testid="navbar-cart-btn"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                <span
                  className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#DE1B76] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-xs"
                  data-testid="cart-badge"
                >
                  {mounted ? totalItems : 0}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-800 hidden md:inline">
                Mi Carrito
              </span>
            </button>

            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl p-2 text-gray-700 hover:bg-gray-100"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Buscador Móvil */}
        <div ref={mobileSearchRef} className="sm:hidden relative pb-2.5 pt-0.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar en Natbell..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                leftIcon={<Search className="w-3.5 h-3.5 text-gray-400" />}
                className="bg-gray-50/80 border-gray-200 text-gray-900 text-xs rounded-lg"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-zinc-900 hover:bg-[#DE1B76] text-white px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0"
            >
              Buscar
            </Button>
          </form>

          <NavbarSearchDropdown
            show={showDropdown}
            isSearching={isSearching}
            results={searchResults}
            searchQuery={searchQuery}
            onSelectResult={() => setShowDropdown(false)}
            onSubmitAll={handleSearchSubmit}
          />
        </div>
      </div>

      <NavbarMobileMenu
        isOpen={mobileMenuOpen}
        navCategories={NAV_CATEGORIES}
        currentPath={pathname}
        onClose={() => setMobileMenuOpen(false)}
      />

      <CartDrawer />
    </header>
  );
}
