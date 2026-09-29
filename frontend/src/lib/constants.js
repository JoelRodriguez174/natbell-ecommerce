/**
 * Constantes globales de configuración de la tienda Natbell
 */

export const FREE_SHIPPING_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 60000
);
