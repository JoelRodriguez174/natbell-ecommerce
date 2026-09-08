"use client";

import React from "react";
import Link from "next/link";
import { X, ChevronRight, Sparkles, Tag, ShieldCheck, Phone } from "lucide-react";

export default function MobileMenu({ isOpen, onClose, categories = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">
              LOS <span className="text-rose-600">ARRAYANES</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories & Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Explorar Catálogo
            </p>
            <div className="space-y-1">
              <Link
                href="/productos"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span>Todos los Productos</span>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
              <Link
                href="/productos?featured=true"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} /> Destacados
                </span>
                <ChevronRight size={16} className="text-rose-400" />
              </Link>
              <Link
                href="/productos?on_sale=true"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Tag size={16} /> Ofertas Especiales
                </span>
                <ChevronRight size={16} className="text-emerald-400" />
              </Link>
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Categorías
              </p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id || cat.slug}
                    href={`/categoria/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck size={16} className="text-rose-500 shrink-0" />
            <span>Distribuidora Mayorista y Minorista</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Phone size={16} className="text-emerald-500 shrink-0" />
            <span>Atención personalizada en Argentina</span>
          </div>
        </div>
      </div>
    </div>
  );
}
