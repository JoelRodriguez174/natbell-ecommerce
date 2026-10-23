import { getProducts } from "@/lib/api";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://natbell.com.ar").replace(/\/+$/, "");

export const revalidate = 3600;

export default async function sitemap() {
  const staticPages = ["", "/productos", "/sobre-nosotros"].map((path) => ({ url: `${SITE_URL}${path}` }));
  try {
    const { items = [] } = await getProducts({ per_page: 1000 });
    return [...staticPages, ...items.map((p) => ({ url: `${SITE_URL}/productos/${p.slug}` }))];
  } catch {
    return staticPages;
  }
}
