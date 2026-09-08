"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { adminAuth } from "@/store/adminAuth";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Productos", href: "/admin/productos", icon: Package },
    { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
    { label: "Zonas de Envío", href: "/admin/envios", icon: Truck },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-900 shrink-0">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-600/30">
            A
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block leading-none">
              ARRAYANES
            </span>
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-0.5 block">
              Panel Admin
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-slate-900 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={16} /> Ver tienda pública
          </span>
        </Link>
        <button
          onClick={() => adminAuth.logout()}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-left"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
