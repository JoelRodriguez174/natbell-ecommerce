import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Grilla / listado horizontal de marcas oficiales comercializadas por Natbell.
 */
export default function HomeBrandsRibbon({ brands = [], isLoading = false }) {
  return (
    <section className="bg-white border-y border-rose-100/60 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            Marcas Líderes en Distribución Oficial
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-center gap-2 sm:gap-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full md:w-28 rounded-lg" />
            ))
          ) : (
            brands.map((b) => (
              <Link
                key={b.id || b.slug}
                href={`/productos?brand=${b.slug}`}
                className="px-3.5 py-2 rounded-xl bg-gray-50/80 hover:bg-rose-50/50 border border-gray-200/80 hover:border-[#DE1B76]/30 text-xs font-bold text-gray-800 hover:text-[#DE1B76] transition-colors shadow-2xs text-center truncate w-full md:w-auto block"
                title={b.name}
              >
                {b.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
