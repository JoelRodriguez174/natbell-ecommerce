const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://natbell.com.ar").replace(/\/+$/, "");

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/pago", "/pedido"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
