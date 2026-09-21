import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Componente atómico de Logo oficial de Natbell.
 * Sincroniza el isotipo fotográfico oficial (/img/logo-natbell.jpeg)
 * con la tipografía de marca: "Nat" (Magenta #DE1B76) + "Bell" (Verde #5EB82D).
 */
export default function NatbellLogo({
  size = "md",
  showImage = true,
  showText = true,
  variant = "default", // "default" | "light" | "white"
  className = "",
}) {
  const sizeMap = {
    sm: {
      imgSize: 32,
      imgClass: "w-8 h-8",
      titleClass: "text-lg",
      subtitleClass: "text-[7.5px]",
    },
    md: {
      imgSize: 40,
      imgClass: "w-9 h-9 sm:w-10 sm:h-10",
      titleClass: "text-xl sm:text-2xl",
      subtitleClass: "text-[8px] sm:text-[9px]",
    },
    lg: {
      imgSize: 52,
      imgClass: "w-12 h-12 sm:w-14 sm:h-14",
      titleClass: "text-2xl sm:text-3xl",
      subtitleClass: "text-[10px] sm:text-xs",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const isLight = variant === "light" || variant === "white";

  return (
    <div className={cn("inline-flex items-center gap-2.5 sm:gap-3 select-none", className)}>
      {showImage && (
        <div
          className={cn(
            "relative rounded-xl overflow-hidden shadow-xs border border-rose-100/80 bg-white shrink-0 flex items-center justify-center p-0.5",
            currentSize.imgClass
          )}
        >
          <Image
            src="/img/logo-natbell.jpeg"
            alt="Natbell Logo"
            width={currentSize.imgSize}
            height={currentSize.imgSize}
            className="w-full h-full object-cover rounded-lg"
            priority
          />
        </div>
      )}

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline tracking-tight font-black font-sans">
            <span className={cn(isLight ? "text-white" : "text-[#DE1B76]")}>
              Nat
            </span>
            <span className={cn(isLight ? "text-emerald-400" : "text-[#5EB82D]")}>
              Bell
            </span>
          </div>
          <span
            className={cn(
              "uppercase font-bold tracking-widest mt-0.5 whitespace-nowrap",
              currentSize.subtitleClass,
              isLight ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Distribuidora de Belleza
          </span>
        </div>
      )}
    </div>
  );
}
