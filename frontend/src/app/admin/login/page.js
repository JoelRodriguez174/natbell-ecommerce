"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { adminAuth } from "@/store/adminAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@losarrayanes.com");
  const [password, setPassword] = useState("admin123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminAuth.login(email.trim(), password);
      router.push("/admin");
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg shadow-rose-600/30">
            A
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Acceso Administrativo
          </h1>
          <p className="text-xs text-slate-400">
            Los Arrayanes • Distribuidora de Belleza
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Correo Electrónico
            </label>
            <Input
              type="email"
              icon={Mail}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Contraseña
            </label>
            <Input
              type="password"
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-rose-500"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full group"
            >
              <span>Ingresar al Panel</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800/60 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-rose-500" />
            Acceso restringido para administradores autorizados
          </span>
        </div>
      </div>
    </div>
  );
}
