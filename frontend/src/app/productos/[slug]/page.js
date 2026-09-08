"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const { addItem, openDrawer } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/api/products/${slug}`);
        setProduct(data);
        if (data.image_urls?.length > 0) {
          setSelectedImage(data.image_urls[0]);
        }
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (e) {
        console.error("Error loading product:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleCalculateShipping = async (e) => {
    e.preventDefault();
    if (!postalCode.trim()) return;
    setShippingLoading(true);
    try {
      const res = await apiFetch(
        `/api/shipping/quote?postal_code=${encodeURIComponent(postalCode.trim())}`
      );
      setShippingQuote(res);
    } catch (e) {
      console.error("Error quoting shipping:", e);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedVariant, quantity);
    addToast(`"${product.name}" agregado al carrito`, "success");
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <Skeleton className="aspect-square w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-6 space-y-5">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Producto no encontrado</h2>
        <p className="text-slate-500 text-sm mt-2">
          El producto que buscas ya no está disponible o ha cambiado de enlace.
        </p>
        <Link href="/productos" className="mt-6 inline-block">
          <Button variant="primary">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  // Active price based on variant override or sale price
  const currentPrice = selectedVariant?.price_override
    ? Number(selectedVariant.price_override)
    : Number(product.sale_price || product.base_price);

  const currentStock = selectedVariant?.stock ?? 99;
  const isOutOfStock = currentStock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/productos" className="hover:text-slate-800 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} />
          <span>Catálogo</span>
        </Link>
        <span>/</span>
        {product.subcategory?.category && (
          <>
            <Link
              href={`/categoria/${product.subcategory.category.slug}`}
              className="hover:text-slate-800 transition-colors"
            >
              {product.subcategory.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-700 truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery / Image column */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200/80 p-6 flex items-center justify-center shadow-xs overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-300 font-bold text-center">
                <div className="w-24 h-24 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 font-black text-3xl mx-auto mb-2">
                  {product.brand?.name ? product.brand.name.charAt(0) : "A"}
                </div>
                <span>Los Arrayanes</span>
              </div>
            )}

            {product.is_on_sale && (
              <div className="absolute top-4 left-4">
                <Badge variant="emerald" size="md">
                  Oferta
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.image_urls?.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.image_urls.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-18 h-18 rounded-2xl bg-white border p-1 shrink-0 transition-all ${
                    selectedImage === img
                      ? "border-rose-500 ring-2 ring-rose-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            {/* Brand */}
            {product.brand?.name && (
              <Link
                href={`/marca/${product.brand.slug}`}
                className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 mb-2"
              >
                {product.brand.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900">
              {formatPrice(currentPrice)}
            </span>
            {product.is_on_sale && product.sale_price && (
              <span className="text-sm font-semibold text-slate-400 line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex justify-between">
                <span>Seleccionar Variante</span>
                <span className="text-slate-400 font-normal">
                  SKU: {selectedVariant?.sku}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {v.variant_name}
                      {v.price_override && (
                        <span className="ml-1.5 opacity-70 text-[10px]">
                          ({formatPrice(v.price_override)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden p-1 shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="px-3 text-sm font-bold text-slate-900 min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
              >
                <ShoppingBag size={18} />
                <span>{isOutOfStock ? "Sin Stock" : "Agregar al Carrito"}</span>
              </Button>
            </div>

            {/* Buy now button */}
            {!isOutOfStock && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleBuyNow}
                className="w-full"
              >
                Comprar Ahora (Checkout Directo)
              </Button>
            )}
          </div>

          {/* Postal Code Shipping Calculator Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Truck size={16} className="text-rose-600" />
              <span>Calcular costo y tiempo de envío</span>
            </div>
            <form onSubmit={handleCalculateShipping} className="flex gap-2">
              <input
                type="text"
                placeholder="Tu Código Postal (ej: 1425, 5700)"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-rose-500"
              />
              <Button
                variant="outline"
                size="sm"
                type="submit"
                loading={shippingLoading}
              >
                Calcular
              </Button>
            </form>
            {shippingQuote && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center animate-in fade-in">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Zona {shippingQuote.zone_name}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Llega en aprox. {shippingQuote.estimated_days} días hábiles
                  </span>
                </div>
                <span className="font-black text-rose-600 text-sm">
                  {formatPrice(shippingQuote.cost)}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Descripción
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
