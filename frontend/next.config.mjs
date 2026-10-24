import { DEVICE_SIZES, IMAGE_SIZES } from "./src/lib/imageSizes.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 90, 100],
    // Las imágenes subidas tienen nombre único y no cambian: cachear 31 días evita re-bajarlas de Supabase (cached egress)
    minimumCacheTTL: 2678400,
    // Pocos anchos = menos variantes por foto (1254 productos): menos transformaciones en Vercel y menos descargas desde Supabase
    // Las fotos de productos (/img) no pasan por acá: las achica el propio proxy con sharp (ver productImageLoader)
    deviceSizes: DEVICE_SIZES,
    imageSizes: IMAGE_SIZES,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "swozzogsoxahbcpxhujk.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
