/**
 * Utilidades generales para el frontend de Natbell
 */

/**
 * Formatea un monto numérico a Pesos Argentinos (ARS)
 * Ej: 12500 -> "$ 12.500"
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "$ 0";
  }

  const num = Number(amount);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

export const formatPrice = formatCurrency;

/**
 * Sanitiza parámetros de texto para prevenir XSS reflejado y caracteres no deseados
 */
export function sanitizeQuery(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>'"/\\;`]/g, "")
    .trim()
    .slice(0, 100);
}

/**
 * Genera un query string omitiendo parámetros vacíos, nulos o indefinidos
 */
export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

/**
 * Formatea una fecha ISO a string legible en español (Argentina)
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Combina condicionalmente nombres de clases CSS
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Solo las imágenes de Supabase pasan por el optimizador de Next (resize + WebP + cache);
 * otros dominios externos se sirven tal cual para no romper si no están en remotePatterns.
 */
export function skipImageOptimization(src) {
  return Boolean(src?.startsWith("http") && !src.includes(".supabase.co/"));
}

const SUPABASE_PRODUCTS_PATH = "/storage/v1/object/public/products/";

/**
 * El bucket de fotos es privado: las URLs de Supabase guardadas en la BD se sirven por el proxy /img
 * (cacheado en Vercel). Cualquier otra URL se devuelve sin cambios.
 */
export function productImageSrc(src) {
  const idx = typeof src === "string" ? src.indexOf(SUPABASE_PRODUCTS_PATH) : -1;
  return idx >= 0 ? `/img/${src.slice(idx + SUPABASE_PRODUCTS_PATH.length).split("?")[0]}` : src;
}
