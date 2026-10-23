import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export default async function sitemap() {
  const staticPages = ["", "/productos", "/sobre-nosotros"].map((path) => ({ url: `${SITE_URL}${path}` }));
  const productPages = [];
  try {
    // La API devuelve máx. 1000 por página y el catálogo ya supera eso
    for (let page = 1; page <= 20; page++) {
      const { items = [], pagination } = await getProducts({ per_page: 1000, page });
      productPages.push(...items.map((p) => ({ url: `${SITE_URL}/productos/${p.slug}` })));
      if (!pagination?.has_next) break;
    }
  } catch {
    // Sin API: se publican las páginas fijas y lo que se haya alcanzado a leer
  }
  return [...staticPages, ...productPages];
}
