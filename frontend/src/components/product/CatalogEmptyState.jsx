import { PackageSearch } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Vista de estado vacío cuando ninguna coincidencia de búsqueda o filtro arroja resultados.
 */
export default function CatalogEmptyState({
  emptyTitle = "No encontramos productos",
  emptySubtitle = "Intenta con otros filtros o términos de búsqueda.",
  onResetFilters,
}) {
  return (
    <div className="bg-white rounded-2xl border border-rose-100/70 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-[#DE1B76]">
        <PackageSearch className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-gray-900">{emptyTitle}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{emptySubtitle}</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onResetFilters}
        className="bg-zinc-900 hover:bg-[#DE1B76] text-white text-xs px-5 py-2.5 font-bold rounded-xl transition-colors cursor-pointer"
      >
        Limpiar todos los filtros
      </Button>
    </div>
  );
}
