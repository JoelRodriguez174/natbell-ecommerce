// Anchos de imagen compartidos entre next.config (srcset de next/image) y el proxy /img, que solo achica a estos.
// Cambiarlos invalida todas las fotos ya cacheadas.
export const DEVICE_SIZES = [640, 828, 1200];
export const IMAGE_SIZES = [64, 128, 256, 384];
export const IMG_PROXY_WIDTHS = [...IMAGE_SIZES, ...DEVICE_SIZES];
