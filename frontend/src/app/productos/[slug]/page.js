"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ProductGallery from "@/components/product/ProductGallery";
import VariantSelector from "@/components/product/VariantSelector";
import ProductGrid from "@/components/product/ProductGrid";
import ShippingCalculator from "@/components/cart/ShippingCalculator";
import { useCartStore } from "@/store/useCartStore";
import { getProductBySlug, getProducts } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug;

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const closeCart = useCartStore((state) => state.closeCart);

  // Consulta de producto por slug
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    retry: 1,
  });

  // Consultas para productos relacionados (categoría y marca)
  const { data: categoryData } = useQuery({
    queryKey: ["products", "category", product?.category_slug],
    queryFn: () => getProducts({ category: product?.category_slug, per_page: 6 }),
    enabled: Boolean(product?.category_slug),
  });

  const { data: brandData } = useQuery({
    queryKey: ["products", "brand", product?.brand_slug],
    queryFn: () => getProducts({ brand: product?.brand_slug, per_page: 6 }),
    enabled: Boolean(product?.brand_slug),
  });

  // Filtrar el producto actual y limitar a 4 ítems
  const relatedCategoryProducts = (categoryData?.items || [])
    .filter((p) => p.slug !== slug)
    .slice(0, 4);

  const relatedBrandProducts = (brandData?.items || [])
    .filter((p) => p.slug !== slug)
    .slice(0, 4);

  // Inicializar la primera variante disponible cuando carga el producto
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstInStock =
        product.variants.find((v) => v.stock > 0) || product.variants[0];
      setSelectedVariant(firstInStock);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <Skeleton className="h-5 w-48 rounded" />
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-10 w-48 rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          El artículo que estás buscando no existe o fue despublicado temporalmente.
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push("/productos")}
          className="inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Button>
      </div>
    );
  }

  // Prioridad de imágenes
  const productImages = (product.image_urls && product.image_urls.length > 0)
    ? product.image_urls
    : (product.images && product.images.length > 0)
    ? product.images
    : (product.slug ? [`/products/${product.slug}.webp`] : []);

  // Precio reactivo
  const currentPrice =
    selectedVariant?.price_override != null
      ? selectedVariant.price_override
      : (product.is_on_sale && product.sale_price ? product.sale_price : product.base_price);

  const cuotaPrice = Math.round(Number(currentPrice) / 3);

  // Stock reactivo asegurado
  const availableStock = (selectedVariant?.stock != null && selectedVariant.stock > 0)
    ? selectedVariant.stock
    : (product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 25);

  const isOutOfStock = false;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity, true);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity, false);
    closeCart();
    router.push("/carrito");
  };

  const breadcrumbs = [
    { label: "Catálogo", href: "/productos" },
    ...(product.category_name
      ? [{ label: product.category_name, href: `/productos?category=${product.category_slug || ""}` }]
      : []),
    { label: product.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      {/* UN SOLO CONTENEDOR UNIFICADO ESTILO MERCADOLIBRE CON SEPARADORES */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-10 divide-y divide-gray-200">
        
        {/* BLOQUE SUPERIOR: Galería y Módulo de Compra */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start pb-10">
          {/* Columna Izquierda: Galería Integrada */}
          <div className="lg:col-span-7 flex justify-center">
            <ProductGallery images={productImages} productName={product.name} />
          </div>

          {/* Columna Derecha: Datos de Compra (Integrados en el mismo contenedor) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Marca y Badges */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {product.brand_name || "NATBELL"}
              </span>

              <div className="flex items-center gap-1.5">
                {product.is_on_sale && (
                  <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
                    OFERTA
                  </span>
                )}
              </div>
            </div>

            {/* Nombre del Producto */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Precios y Cuotas sin recuadro interno */}
            <div className="space-y-3">
              {product.is_on_sale && product.sale_price && (
                <span className="text-sm text-gray-400 line-through block">
                  {formatCurrency(product.base_price)}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                  {formatCurrency(currentPrice)}
                </span>
                {isOutOfStock && (
                  <Badge variant="outOfStock">Agotado</Badge>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                <p className="text-gray-700">
                  Mismo precio en <span className="font-bold text-gray-900">3 cuotas</span> de {formatCurrency(cuotaPrice)}
                </p>
                <p className="text-gray-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <span>Hasta 6 cuotas con MercadoPago con todas las tarjetas</span>
                </p>
              </div>
            </div>

            {/* Selector de Variantes */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onSelectVariant={(v) => {
                  setSelectedVariant(v);
                  setQuantity(1);
                }}
                basePrice={product.base_price}
              />
            )}

            {/* Selector de Cantidad y Botones de Compra */}
            <div className="space-y-4 pt-1">
              {/* Selector de Cantidad */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Cantidad</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white p-1">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={quantity}
                      disabled={isOutOfStock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") return;
                        const parsed = parseInt(val, 10);
                        if (isNaN(parsed)) return;
                        if (parsed > availableStock) {
                          setQuantity(availableStock);
                        } else if (parsed <= 0) {
                          setQuantity(1);
                        } else {
                          setQuantity(parsed);
                        }
                      }}
                      onBlur={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (isNaN(parsed) || parsed < 1) {
                          setQuantity(1);
                        } else if (parsed > availableStock) {
                          setQuantity(availableStock);
                        }
                      }}
                      className="w-10 text-center text-sm font-bold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                      aria-label="Cantidad a comprar"
                      data-testid="product-qty-input"
                    />
                    <button
                      type="button"
                      disabled={quantity >= availableStock || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      className="w-8 h-8 rounded flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 font-normal">
                    ({availableStock} disponibles)
                  </span>
                </div>
              </div>

              {/* Botones de Acción apilados con alturas idénticas (48px / h-12) */}
              <div className="space-y-2.5">
                {/* Opción Comprar Ahora */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="w-full h-12 bg-zinc-950 hover:bg-black text-white text-sm sm:text-base font-bold rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{isOutOfStock ? "Producto Agotado" : "Comprar ahora"}</span>
                </button>

                {/* Opción Agregar al Carrito */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm sm:text-base font-bold rounded-xl border border-gray-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-gray-700" />
                  <span>Agregar al Carrito</span>
                </button>
              </div>

              {/* Aviso feedback */}
              {addedNotice && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    ¡Agregaste {quantity} {quantity === 1 ? "unidad" : "unidades"} de{" "}
                    <strong>{product.name}</strong> al carrito!
                  </span>
                </div>
              )}
            </div>

            {/* Beneficios de Compra integrados sin tarjeta pesada */}
            <div className="pt-4 border-t border-gray-100 space-y-3 text-xs text-gray-600">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Envíos a todo el país con tarifas fijas por zona</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
                <span>Garantía oficial y productos 100% originales</span>
              </div>
            </div>

            {/* Cotizador de envíos integrado */}
            <div className="pt-2">
              <ShippingCalculator />
            </div>
          </div>
        </div>

        {/* SECCIÓN DESCRIPCIÓN (Separada por línea horizontal dentro del mismo contenedor) */}
        <div className="py-10 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
            Descripción
          </h2>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm max-w-4xl">
            {product.description || "Sin descripción adicional proporcionada por el fabricante."}
          </div>
        </div>

        {/* SECCIÓN FICHA TÉCNICA (Separada por línea horizontal dentro del mismo contenedor) */}
        <div className="pt-10 space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
            Características del producto
          </h3>
          <div className="max-w-4xl border border-gray-200 rounded-xl overflow-hidden text-sm">
            <div className="divide-y divide-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-gray-50/70">
                <span className="font-semibold text-gray-600 text-xs sm:text-sm">Marca</span>
                <span className="sm:col-span-2 text-gray-900 font-medium">{product.brand_name || "NATBELL"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white">
                <span className="font-semibold text-gray-600 text-xs sm:text-sm">Categoría</span>
                <span className="sm:col-span-2 text-gray-900 font-medium">{product.category_name || "Cosmética Capilar"}</span>
              </div>
              {selectedVariant?.sku && (
                <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-gray-50/70">
                  <span className="font-semibold text-gray-600 text-xs sm:text-sm">Código / SKU</span>
                  <span className="sm:col-span-2 text-gray-900 font-mono text-xs">{selectedVariant.sku}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white">
                <span className="font-semibold text-gray-600 text-xs sm:text-sm">Condición del ítem</span>
                <span className="sm:col-span-2 text-gray-900 font-medium">Nuevo • 100% Original</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-gray-50/70">
                <span className="font-semibold text-gray-600 text-xs sm:text-sm">Disponibilidad de stock</span>
                <span className="sm:col-span-2 text-emerald-700 font-semibold">
                  {availableStock > 0 ? `${availableStock} unidades en stock` : "Agotado"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN INFERIOR 1: Quienes vieron este producto también compraron (Categoría) */}
      {relatedCategoryProducts.length > 0 && (
        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              Quienes vieron este producto también compraron
            </h2>
            {product.category_slug && (
              <Link
                href={`/productos?category=${product.category_slug}`}
                className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-black underline underline-offset-4"
              >
                Ver más en {product.category_name}
              </Link>
            )}
          </div>
          <ProductGrid products={relatedCategoryProducts} />
        </section>
      )}

      {/* SECCIÓN INFERIOR 2: Más publicaciones de la misma marca */}
      {relatedBrandProducts.length > 0 && (
        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              Más productos de {product.brand_name || "esta marca"}
            </h2>
            {product.brand_slug && (
              <Link
                href={`/productos?brand=${product.brand_slug}`}
                className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-black underline underline-offset-4"
              >
                Ver todo de {product.brand_name}
              </Link>
            )}
          </div>
          <ProductGrid products={relatedBrandProducts} />
        </section>
      )}
    </div>
  );
}
