import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export default async function sitemap() {
  const staticPages = ["", "/productos", "/sobre-nosotros"].map((path) => ({ url: `${SITE_URL}${path}` }));
  const productPages = [];
  try {
    // La API pública devuelve máx. 100 por página
    for (let page = 1; page <= 100; page++) {
      const { items = [], pagination } = await getProducts({ per_page: 100, page });
      productPages.push(...items.map((p) => ({ url: `${SITE_URL}/productos/${p.slug}` })));
      if (!pagination?.has_next) break;
    }
  } catch {
    // Sin API: se publican las páginas fijas y lo que se haya alcanzado a leer
  }
  return [...staticPages, ...productPages];
}
