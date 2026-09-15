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

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-950">Asesoramiento Técnico a Salones</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Acompañamos a coloristas y profesionales con listas de precios mayoristas, fichas de aplicación técnica y atención directa por WhatsApp.
          </p>
        </div>
      </div>

      {/* Banner Mayorista */}
      <div className="bg-zinc-950 text-white rounded-2xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Atención Mayorista
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            ¿Tenés un salón, peluquería o academia?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Ofrecemos condiciones comerciales especiales por bulto cerrado, reposición programada y facturación A o B para empresas y profesionales independientes.
          </p>
          <ul className="flex flex-wrap gap-4 text-xs text-zinc-300 justify-center lg:justify-start pt-2">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Listas de precios diferenciales</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Factura A y B</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Garantía oficial en máquinas</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <a
            href="https://wa.me/5491100000000?text=Hola%20Natbell,%20quisiera%20asesoramiento%20mayorista"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md text-sm w-full sm:w-auto"
            >
              Consultar por WhatsApp
            </Button>
          </a>
          <Link href="/productos">
            <Button
              variant="secondary"
              size="md"
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-6 py-3.5 rounded-xl text-sm w-full sm:w-auto"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
