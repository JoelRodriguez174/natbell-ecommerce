"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  KeyRound,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, forgotPassword, resetPassword, isLoading, error } = useAdminAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Recovery modal state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);

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

  const handleSendRecoveryCode = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");

    if (!recoveryEmail.trim()) {
      setRecoveryError("Por favor, ingrese su correo electrónico.");
      return;
    }

    setIsRecovering(true);
    const res = await forgotPassword(recoveryEmail.trim());
    setIsRecovering(false);

    if (res.success) {
      setRecoveryStep(2);
      setRecoveryMessage("Si el correo está registrado, enviamos un código de 6 dígitos.");
    } else {
      setRecoveryError(res.error || "No se pudo procesar la solicitud.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryError("");

    if (!recoveryOtp.trim() || recoveryOtp.trim().length !== 6) {
      setRecoveryError("El código debe tener 6 dígitos.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setRecoveryError("La nueva contraseña debe tener un mínimo de 8 caracteres.");
      return;
    }

    setIsRecovering(true);
    const res = await resetPassword(recoveryEmail.trim(), recoveryOtp.trim(), newPassword);
    setIsRecovering(false);

    if (res.success) {
      setRecoveryMessage("¡Contraseña actualizada exitosamente! Ya podés ingresar.");
      setTimeout(() => {
        setIsRecoveryOpen(false);
        setRecoveryStep(1);
        setRecoveryEmail("");
        setRecoveryOtp("");
        setNewPassword("");
        setRecoveryMessage("");
      }, 2500);
    } else {
      setRecoveryError(res.error || "Código incorrecto o expirado.");
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
                placeholder="admin@natbell.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryOpen(true);
                  setRecoveryStep(1);
                  setRecoveryError("");
                  setRecoveryMessage("");
                  setRecoveryEmail(email);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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

        {/* Register CTA */}
        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <Link
            href="/admin/registro"
            className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>¿Nuevo administrador? Registrate con la clave de empresa</span>
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-500">
          Uso restringido para personal autorizado de Natbell. Todas las sesiones son auditadas.
        </p>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRecoveryOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100">
                Recuperación de Contraseña
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {recoveryStep === 1
                  ? "Ingresá tu correo para recibir un código de recuperación"
                  : "Ingresá el código de 6 dígitos y definí tu nueva clave"}
              </p>
            </div>

            {recoveryError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoveryMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{recoveryMessage}</span>
              </div>
            )}

            {recoveryStep === 1 ? (
              <form onSubmit={handleSendRecoveryCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="admin@natbell.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRecovering ? "Enviando código..." : "Enviar Código de Recuperación"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full tracking-widest text-center font-mono text-lg py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-amber-400 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nueva contraseña (mínimo 8 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRecovering ? "Actualizando..." : "Restablecer Contraseña"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
