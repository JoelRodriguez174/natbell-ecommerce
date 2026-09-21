import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@heroui/react";
import { ChevronRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * Dropdown flotante para los resultados de la búsqueda predictiva en Navbar.
 */
export default function NavbarSearchDropdown({
  show,
  isSearching,
  results = [],
  searchQuery = "",
  onSelectResult,
  onSubmitAll,
}) {
  if (!show) return null;

  return (
    <Card className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
      <CardContent className="p-0">
        {isSearching ? (
          <div className="p-4 text-center text-xs text-gray-500">
            Buscando en el catálogo...
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-gray-100 max-h-72 sm:max-h-80 overflow-y-auto">
            {results.map((item) => {
              const img = item.image_urls?.[0] || item.images?.[0] || `/products/${item.slug}.webp`;
              return (
                <Link
                  key={item.id}
                  href={`/productos/${item.slug}`}
                  onClick={onSelectResult}
                  className="flex items-center gap-3 p-3 hover:bg-rose-50/40 transition-colors group"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                    {img ? (
                      <Image
                        src={img}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-medium text-gray-800 group-hover:text-[#DE1B76] truncate transition-colors">
                      {item.name}
                    </p>
                    <span className="text-[10px] text-[#5EB82D] uppercase font-bold">
                      {item.brand_name || "NATBELL"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 shrink-0">
                    {formatCurrency(item.base_price)}
                  </div>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={onSubmitAll}
              className="w-full py-2.5 px-4 text-center text-xs font-bold text-gray-900 bg-gray-50 hover:bg-rose-50/60 hover:text-[#DE1B76] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Ver todos los resultados para &ldquo;{searchQuery}&rdquo;</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-gray-500">
            No encontramos productos para &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </CardContent>
    </Card>
  );
}
