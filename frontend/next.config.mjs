/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 90, 100],
    // Las imágenes subidas tienen nombre único y no cambian: cachear 31 días evita re-bajarlas de Supabase (cached egress)
    minimumCacheTTL: 2678400,
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
