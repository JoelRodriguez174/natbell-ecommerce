"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAdminAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Por favor, ingrese correo electrónico y contraseña.");
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push("/admin");
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background aesthetic gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to store link */}
      <div className="w-full max-w-md mb-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-xl mx-auto mb-4 shadow-lg shadow-amber-500/20">
            N
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            Natbell Backoffice
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-amber-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acceso de Administración</span>
          </div>
        </div>

        {/* Error Alert */}
        {displayedError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@losarrayanes.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <span>Ingresar al Panel</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-zinc-500">
          Uso restringido para personal autorizado de Natbell. Todas las sesiones son auditadas.
        </p>
      </div>
    </div>
  );
}
