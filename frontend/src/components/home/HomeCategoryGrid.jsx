import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Scissors,
  Droplets,
  Palette,
  Package,
  ShieldCheck,
  Sparkles,
  Zap,
  Eye,
  Waves,
  Brush,
  Layers,
} from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

function getCategoryIcon(slug) {
  switch (slug) {
    case "coloracion":
      return <Palette className="w-5 h-5 text-[#DE1B76]" />;
    case "tratamientos-capilares":
      return <Sparkles className="w-5 h-5 text-[#5EB82D]" />;
    case "shampoos-y-acondicionadores":
      return <Droplets className="w-5 h-5 text-blue-600" />;
    case "styling-fijacion":
      return <Flame className="w-5 h-5 text-amber-600" />;
    case "barberia":
      return <Scissors className="w-5 h-5 text-zinc-700" />;
    case "maquinas-y-herramientas":
      return <Zap className="w-5 h-5 text-yellow-600" />;
    case "accesorios-de-peluqueria":
      return <Package className="w-5 h-5 text-[#5EB82D]" />;
    case "pestanas-y-cejas":
      return <Eye className="w-5 h-5 text-[#DE1B76]" />;
    case "descartables-e-higiene":
      return <ShieldCheck className="w-5 h-5 text-teal-600" />;
    case "unas-y-manicuria":
      return <Brush className="w-5 h-5 text-[#DE1B76]" />;
    case "ondulacion":
      return <Waves className="w-5 h-5 text-indigo-600" />;
    default:
      return <Layers className="w-5 h-5 text-zinc-600" />;
  }
}

export default function HomeCategoryGrid({ categories = [], isLoading = false }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
      <div className="flex items-center justify-between border-b border-rose-100/70 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Categorías Principales
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Encontrá rápidamente lo que necesitás para tu trabajo diario
          </p>
        </div>
        <Link
          href="/productos"
          className="text-xs font-bold text-[#DE1B76] hover:text-[#c21464] flex items-center gap-1 transition-colors"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg" />
                <Skeleton className="w-10 sm:w-14 h-3 sm:h-4 rounded-full" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Skeleton className="h-3.5 sm:h-4 w-3/4 rounded" />
                <Skeleton className="h-2.5 sm:h-3 w-full rounded" />
                <Skeleton className="h-2.5 sm:h-3 w-2/3 rounded" />
              </div>
              <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24 rounded pt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((c) => (
            <Link
              key={c.id || c.slug}
              href={`/productos?category=${c.slug}`}
              className="group bg-white border border-rose-100/60 hover:border-[#DE1B76]/40 rounded-xl p-3 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-2.5 sm:space-y-4"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-rose-50/50 border border-rose-100/80 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  {getCategoryIcon(c.slug)}
                </div>
                {c.subcategories && c.subcategories.length > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                    {c.subcategories.length} {c.subcategories.length === 1 ? "línea" : "líneas"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#DE1B76] line-clamp-1 sm:line-clamp-none transition-colors">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700 group-hover:text-[#DE1B76] flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>Explorar</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#DE1B76]" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
