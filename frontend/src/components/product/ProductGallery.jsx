"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images = [], productName = "Producto" }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const validImages = Array.isArray(images) ? images : [];
  const currentImage = validImages[selectedIndex];
  const hasCurrentError = imageErrors[selectedIndex];

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Visor Principal integrado (sin marco propio, tamaño moderado) */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 flex items-center justify-center bg-white overflow-hidden p-4">
        {currentImage && !hasCurrentError ? (
          <img
            src={currentImage}
            alt={`${productName} - Vista ${selectedIndex + 1}`}
            onError={() => handleImageError(selectedIndex)}
            className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
            <Package className="w-14 h-14 stroke-1 text-gray-300" />
            <span className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
              NATBELL COSMÉTICA
            </span>
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 justify-center sm:justify-start">
          {validImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            const isError = imageErrors[idx];

            return (
              <button
                type="button"
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative w-16 h-16 rounded-xl overflow-hidden border p-1.5 bg-white shrink-0 transition-all duration-150 cursor-pointer flex items-center justify-center",
                  isSelected
                    ? "border-2 border-black shadow-xs ring-1 ring-black/10"
                    : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400"
                )}
              >
                {!isError ? (
                  <img
                    src={img}
                    alt={`${productName} miniatura ${idx + 1}`}
                    onError={() => handleImageError(idx)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-4 h-4 text-gray-300" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
