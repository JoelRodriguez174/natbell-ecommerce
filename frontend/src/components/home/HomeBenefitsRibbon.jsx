import { CreditCard, Truck, ShieldCheck, PhoneCall } from "lucide-react";

/**
 * Cinta de beneficios comerciales rápidos (cuotas, envíos, autenticidad, soporte).
 */
export default function HomeBenefitsRibbon() {
  const benefits = [
    {
      icon: CreditCard,
      iconColor: "text-[#DE1B76]",
      title: "3 y 6 Cuotas Fijas",
      subtitle: "Con todas las tarjetas",
    },
    {
      icon: Truck,
      iconColor: "text-[#5EB82D]",
      title: "Envíos a Todo el País",
      subtitle: "Correo Argentino y Andreani",
    },
    {
      icon: ShieldCheck,
      iconColor: "text-[#DE1B76]",
      title: "100% Originales",
      subtitle: "Garantía de distribuidora oficial",
    },
    {
      icon: PhoneCall,
      iconColor: "text-[#5EB82D]",
      title: "Atención a Salones",
      subtitle: "Asesoramiento por WhatsApp",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-rose-100/70 rounded-xl p-4 flex items-center gap-3 shadow-2xs hover:border-rose-200 transition-colors"
            >
              <Icon className={`w-6 h-6 ${b.iconColor} shrink-0`} />
              <div>
                <p className="text-xs font-bold text-gray-900 leading-snug">{b.title}</p>
                <p className="text-[11px] text-gray-500">{b.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
