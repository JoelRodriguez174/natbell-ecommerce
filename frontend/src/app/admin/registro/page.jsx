"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  KeyRound,
  Loader2,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";

export default function AdminRegistroPage() {
  const router = useRouter();
  const { register, verifyEmail, resendCode, isLoading, error } = useAdminAuthStore();

  const [step, setStep] = useState(1); // 1: Datos + Clave Maestra, 2: Verificación OTP
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password || !inviteCode.trim()) {
      setLocalError("Por favor, completá todos los campos requeridos.");
      return;
    }

    if (password.length < 8) {
      setLocalError("La contraseña debe tener un mínimo de 8 caracteres.");
      return;
    }

    const res = await register(name, email, password, inviteCode);
    if (res.success) {
      setStep(2);
      setSuccessMessage("¡Código de 6 dígitos enviado! Revisá tu casilla de correo.");
      setResendCooldown(60);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setLocalError("Por favor, ingresá el código numérico de 6 dígitos.");
      return;
    }

    const res = await verifyEmail(email, otpCode.trim());
    if (res.success) {
      router.push("/admin");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLocalError("");
    const res = await resendCode(email);
    if (res.success) {
      setSuccessMessage("Nuevo código reenviado a tu email.");
      setResendCooldown(60);
    } else {
      setLocalError("No se pudo reenviar el código. Intente nuevamente.");
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background aesthetic gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <div className="w-full max-w-md mb-6 z-10 flex items-center justify-between">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Login</span>
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Paso {step} de 2</span>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-xl mx-auto mb-4 shadow-lg shadow-amber-500/20">
            N
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            {step === 1 ? "Registro de Administrador" : "Verificación de Correo"}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {step === 1
              ? "Creá tu cuenta de administración con tu clave maestra"
              : `Ingresá el código de 6 dígitos enviado a ${email}`}
          </p>
        </div>

        {/* Error Alert */}
        {displayedError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label htmlFor="admin-name" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Valeria Rossi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="valeria@natbell.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Contraseña deseada
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-invite-code" className="block text-xs font-semibold text-zinc-300">
                  Clave Maestra de Empresa
                </label>
                <span className="text-[11px] text-amber-400 font-medium">Requerida</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-invite-code"
                  type="password"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Clave de seguridad de Natbell"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/60 border border-amber-500/40 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Clave provista exclusivamente por la administración de Natbell / Los Arrayanes.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando registro...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Crear Cuenta y Continuar</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verification OTP Code */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div>
              <label htmlFor="admin-otp" className="block text-center text-xs font-semibold text-zinc-300 mb-2">
                Código de 6 dígitos
              </label>
              <input
                id="admin-otp"
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <p className="mt-2 text-center text-[11px] text-zinc-500">
                Expira en 15 minutos. Si no lo recibís, revisá la carpeta de Correo no deseado (Spam).
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando código...</span>
                </>
              ) : (
                <span>Confirmar y Acceder al Panel</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-none" : ""}`} />
                <span>
                  {resendCooldown > 0
                    ? `Reenviar código en ${resendCooldown}s`
                    : "Reenviar código de verificación"}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ¿Ya tenés una cuenta activa? <span className="text-amber-400 font-semibold">Iniciá Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
