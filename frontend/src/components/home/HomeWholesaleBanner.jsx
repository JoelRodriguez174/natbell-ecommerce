import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Banner comercial para venta mayorista, peluquerías y salones de belleza.
 */
export default function HomeWholesaleBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#1a1017] to-zinc-950 text-white rounded-2xl p-6 sm:p-10 lg:p-12 border border-rose-950/50 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#5EB82D]/10 blur-3xl pointer-events-none" />

        <div className="space-y-4 text-center lg:text-left flex-1 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5EB82D] bg-[#5EB82D]/10 px-3 py-1 rounded-full border border-[#5EB82D]/20">
            Venta Mayorista & Salones
          </span>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            ¿Tenés una peluquería, barbería o centro de estética?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Accedé a listas de precios preferenciales para profesionales, asesoramiento técnico directo, compras por bulto cerrado y reposición periódica con facturación A y B.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-zinc-300 justify-center lg:justify-start">
            <span className="flex items-center gap-1.5 font-medium">✓ Descuentos por volumen</span>
            <span className="flex items-center gap-1.5 font-medium">✓ Factura A y B</span>
            <span className="flex items-center gap-1.5 font-medium">✓ Envíos express a todo el país</span>
            <span className="flex items-center gap-1.5 font-medium">✓ Asistencia técnica personalizada</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto relative z-10">
          <a
            href="https://wa.me/5491100000000?text=Hola%20Natbell,%20quisiera%20consultar%20por%20compras%20mayoristas"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="md"
              leftIcon={<MessageCircle className="w-4 h-4 mr-1 text-white" />}
              className="bg-[#5EB82D] hover:bg-[#4e9c24] text-white font-black px-8 py-3.5 rounded-xl shadow-lg w-full text-sm transition-all cursor-pointer"
            >
              Consultar por WhatsApp
            </Button>
          </a>
          <Link href="/productos" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="bg-white hover:bg-rose-50 text-zinc-950 font-bold px-8 py-3.5 rounded-xl w-full text-sm border border-rose-100"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-4 h-4 ml-1 inline text-[#DE1B76]" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
