"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-auto">
      {/* Value props banner */}
      <div className="border-b border-slate-900 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Truck size={22} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Envíos a Todo el País</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                CABA, GBA e Interior con tarifas fijas por código postal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard size={22} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Pago Seguro con MercadoPago</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tarjetas de débito, crédito, dinero en cuenta o efectivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Productos 100% Originales</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuidores directos de primeras marcas de peluquería y estética.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-sm">
              A
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              LOS <span className="text-rose-500">ARRAYANES</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Distribuidora integral de insumos, coloración, tratamientos capilares, barbería y herramientas profesionales para salones y profesionales de la belleza en Argentina.
          </p>
        </div>

        {/* Col 2: Categorías principales */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">
            Categorías
          </h5>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/categoria/coloracion" className="hover:text-rose-400 transition-colors">
                Coloración & Tinturas
              </Link>
            </li>
            <li>
              <Link href="/categoria/tratamientos-capilares" className="hover:text-rose-400 transition-colors">
                Tratamientos Capilares
              </Link>
            </li>
            <li>
              <Link href="/categoria/shampoos-y-acondicionadores" className="hover:text-rose-400 transition-colors">
                Shampoos y Acondicionadores
              </Link>
            </li>
            <li>
              <Link href="/categoria/barberia" className="hover:text-rose-400 transition-colors">
                Línea Barbería
              </Link>
            </li>
            <li>
              <Link href="/categoria/maquinas-y-herramientas" className="hover:text-rose-400 transition-colors">
                Máquinas y Herramientas
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Marcas destacadas */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">
            Marcas Principales
          </h5>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/marca/nov" className="hover:text-rose-400 transition-colors">Nov</Link>
            </li>
            <li>
              <Link href="/marca/plasma" className="hover:text-rose-400 transition-colors">Plasma</Link>
            </li>
            <li>
              <Link href="/marca/la-puissance" className="hover:text-rose-400 transition-colors">La Puissance</Link>
            </li>
            <li>
              <Link href="/marca/frilayp" className="hover:text-rose-400 transition-colors">Frilayp</Link>
            </li>
            <li>
              <Link href="/marca/eurostyl" className="hover:text-rose-400 transition-colors">Eurostyl</Link>
            </li>
            <li>
              <Link href="/marca/jessamy" className="hover:text-rose-400 transition-colors">Jessamy</Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Atención & Enlaces */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">
            Información
          </h5>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/productos" className="hover:text-rose-400 transition-colors">Catálogo Completo</Link>
            </li>
            <li>
              <Link href="/productos?featured=true" className="hover:text-rose-400 transition-colors">Productos Destacados</Link>
            </li>
            <li>
              <Link href="/productos?on_sale=true" className="hover:text-rose-400 transition-colors">Ofertas y Promociones</Link>
            </li>
            <li>
              <Link href="/carrito" className="hover:text-rose-400 transition-colors">Mi Carrito</Link>
            </li>
            <li className="pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-[11px]"
              >
                <Lock size={12} />
                <span>Panel de Administración</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Los Arrayanes. Todos los derechos reservados. Argentina.</p>
      </div>
    </footer>
  );
}
