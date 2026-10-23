import { SITE_URL } from "@/lib/constants";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/pago", "/pedido"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
