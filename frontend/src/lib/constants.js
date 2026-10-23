/**
 * Constantes globales de configuración de la tienda Natbell
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.natbell.com.ar").replace(/\/+$/, "");

export const FREE_SHIPPING_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 30000
);
