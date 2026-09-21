import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

/**
 * Dropdown accesible para ordenamiento de productos en el catálogo.
 */
export default function CatalogSortDropdown({ currentSort = "featured", onSortChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = SORT_OPTIONS.find((opt) => opt.value === currentSort) || SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative self-end md:self-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-[#DE1B76]/40 text-xs font-semibold text-gray-800 shadow-2xs transition-colors cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-gray-400">Ordenar por:</span>
        <span className="font-bold text-gray-900">{activeOption.label}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-30 animate-in fade-in-50 duration-100"
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === currentSort;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer",
                  isSelected
                    ? "bg-rose-50 text-[#DE1B76] font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#DE1B76]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
