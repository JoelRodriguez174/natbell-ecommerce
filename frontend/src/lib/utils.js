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
 * Combina condicionalmente nombres de clases CSS
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
