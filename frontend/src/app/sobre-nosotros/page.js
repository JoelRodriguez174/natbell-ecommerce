import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Sobre Nosotros — NATBELL",
  description:
    "Conocé más sobre NATBELL, cosmética capilar, peluquería y barbería profesional.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header Institucional */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
          Quiénes Somos en NATBELL
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Somos especialistas en la provisión integral de insumos técnicos, coloración, tratamientos y herramientas profesionales para salones de belleza, barberías y estilistas en toda la Argentina.
        </p>
      </div>

      {/* Grid de Pilares y Compromisos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-950">100% Originales & Directo de Fábrica</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Trabajamos con primeras marcas oficiales como Nov Cosmética, Plasma, Wahl, Kemei, La Puissance y Frilayp, garantizando fórmulas auténticas y stock continuo.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-950">Logística Ágil a Todo el País</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Despachos seguros y embalaje profesional para asegurar que tus tinturas, oxidantes y máquinas lleguen en perfectas condiciones a tu salón o domicilio.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-950">Asesoramiento Técnico</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Acompañamos a nuestros clientes con listas de precios mayoristas, fichas de aplicación técnica y atención directa por WhatsApp al <strong className="text-gray-900 font-bold">2657-63-7180</strong>.
            </p>
          </div>
          <div>
            <a
              href="https://wa.me/5492657637180?text=Hola%20Natbell,%20quisiera%20asesoramiento%20t%C3%A9cnico"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span>Consultar por WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
