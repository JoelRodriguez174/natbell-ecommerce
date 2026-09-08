"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminAuth } from "@/store/adminAuth";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    if (!adminAuth.isAuthenticated()) {
      router.push("/admin/login");
    } else {
      setAdminUser(adminAuth.getUser());
      setCheckingAuth(false);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Verificando sesión administrativa...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 antialiased">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="text-xs font-semibold text-slate-400">
            Panel de Control • Los Arrayanes
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-xs">
              {adminUser?.name ? adminUser.name.charAt(0) : "A"}
            </div>
            <div className="text-xs text-right hidden sm:block">
              <span className="font-bold text-white block">
                {adminUser?.name || "Administrador"}
              </span>
              <span className="text-[10px] text-slate-400">
                {adminUser?.email || "admin@losarrayanes.com"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
