"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@heroui/react";
import { Package, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductCard({ product }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const {
    name,
    slug,
    brand_name,
    category_name,
    base_price,
    sale_price,
    images = [],
    image_urls = [],
    is_featured,
    is_on_sale,
    total_stock = 0,
    in_stock,
  } = product;

  // Prioridad de imágenes: image_urls -> images -> /products/[slug].webp
  const allImages = (image_urls && image_urls.length > 0)
    ? image_urls
    : (images && images.length > 0)
    ? images
    : (slug ? [`/products/${slug}.webp`] : []);

  const primaryImage = !imageError && allImages.length > 0 ? allImages[0] : null;
  const currentPrice = is_on_sale && sale_price ? sale_price : base_price;
  const cuotaPrice = Math.round(Number(currentPrice) / 3);

  return (
    <Card
      onClick={() => router.push(`/productos/${slug}`)}
      className="group relative flex flex-col rounded-xl bg-white hover:border-gray-300 border border-gray-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer h-full"
    >
      {/* Contenedor de Imagen de Producto: proporción más ancha y menos alta con imagen más chica */}
      <CardContent className="p-0 overflow-hidden relative aspect-[4/3] w-full bg-white flex items-center justify-center border-b border-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4">
            <Package className="w-8 h-8 stroke-1 text-gray-300" />
            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
              NATBELL
            </span>
          </div>
        )}
      </CardContent>

      {/* Información del Producto */}
      <CardFooter className="flex flex-col items-start p-3.5 bg-white mt-auto w-full">
        {/* Marca y Categoría */}
        <div className="flex items-center justify-between w-full text-xs mb-1 gap-2">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px] truncate">
            {brand_name || "NATBELL"}
          </span>
          {category_name && (
            <span className="text-gray-400 text-[11px] truncate max-w-[130px]">
              {category_name}
            </span>
          )}
        </div>

        {/* Nombre del Producto */}
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-black transition-colors w-full text-left">
          {name}
        </h3>

        {/* Sección de Precio estilo MercadoLibre / Ossono */}
        <div className="mt-2 pt-2 flex flex-col w-full border-t border-gray-100">
          <div className="flex items-center justify-between min-h-[1.125rem]">
            {is_on_sale && sale_price ? (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(base_price)}
              </span>
            ) : (
              <span />
            )}
            {is_on_sale && (
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                OFERTA
              </span>
            )}
          </div>
          <div className="flex items-baseline w-full">
            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(currentPrice)}
            </span>
          </div>

          {/* Cuotas y Envío */}
          <div className="mt-1 flex flex-col gap-0.5">
            <p className="text-[11px] text-gray-500 font-normal">
              Mismo precio en <span className="font-semibold text-gray-700">3 cuotas</span> de {formatCurrency(cuotaPrice)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-600" />
              <span>Envío a todo el país</span>
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
