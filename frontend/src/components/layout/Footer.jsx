"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin } from "lucide-react";
import NatbellLogo from "@/components/ui/NatbellLogo";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t border-rose-100/60 text-gray-600 text-xs mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <NatbellLogo size="md" />
            </Link>

            <div className="text-[11px] text-gray-500 space-y-1.5 pt-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Envíos a todo el territorio argentino</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>contacto@natbell.com.ar</span>
              </p>
            </div>
          </div>

          {/* Categorías y Marcas divididas en 2 columnas en celular */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:col-span-2 md:grid-cols-2">
            {/* Categorías */}
            <div className="space-y-3">
              <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Categorías
              </h5>
              <ul className="space-y-1.5 text-[11px] sm:text-xs text-gray-500 leading-snug">
                <li>Coloración & Tinturas</li>
                <li>Tratamientos Capilares</li>
                <li>Shampoos Técnicos</li>
                <li>Barbería & Afeitado</li>
                <li>Máquinas & Herramientas</li>
              </ul>
            </div>

            {/* Marcas */}
            <div className="space-y-3">
              <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Marcas Principales
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] sm:text-xs text-gray-500 leading-snug">
                <span>Nov Cosmética</span>
                <span>Plasma</span>
                <span>La Puissance</span>
                <span>Wahl Professional</span>
                <span>Kemei</span>
                <span>Mac Gregor</span>
                <span>Escudo</span>
                <span>Frilayp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior de Copyright */}
      <div className="border-t border-gray-200 bg-gray-50 py-4 text-center text-gray-500 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 NATBELL — Cosmética Capilar & Peluquería.</span>
          <span>Precios expresados en Pesos Argentinos (ARS) e incluyen IVA.</span>
        </div>
      </div>
    </footer>
  );
}
