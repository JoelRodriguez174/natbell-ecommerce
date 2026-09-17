"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { useAdminThemeStore } from "../../store/useAdminThemeStore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Productos", href: "/admin/productos", icon: Package },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { label: "Tarifas de Envío", href: "/admin/envios", icon: Truck },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, adminUser, logout, checkAuth } = useAdminAuthStore();
  const { theme, toggleTheme } = useAdminThemeStore();

  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    setHasMounted(true);
    if (pathname !== "/admin/login") {
      checkAuth();
    }
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  useEffect(() => {
    if (hasMounted && !token && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [hasMounted, token, pathname, router]);

  // Si estamos en la página de login, no aplicar sidebar ni layout guard
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Prevención de flash de contenido no autenticado o durante redirección
  if (!hasMounted || !token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        {hasMounted && !token && (
          <p className="text-sm">Redirigiendo al inicio de sesión de administrador...</p>
        )}
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "dark" : ""
      } bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200`}
    >
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-sm">
            N
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            Natbell <span className="text-amber-600 dark:text-amber-400 font-mono text-xs">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo nocturno"}
            title={isDark ? "Modo Claro" : "Modo Nocturno"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-base shadow-md">
              N
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Natbell
              </h1>
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Panel de Control</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile & Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="px-2">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {adminUser?.name || "Administrador"}
            </p>
            <p className="text-[11px] text-zinc-500 truncate">{adminUser?.email}</p>
          </div>

          <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Nocturno"}
            >
              <span className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{isDark ? "Modo Nocturno" : "Modo Claro"}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {isDark ? "ON" : "OFF"}
              </span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Tienda</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
