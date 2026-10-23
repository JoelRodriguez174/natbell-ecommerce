import { getProductBySlug } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

// La página es "use client": los metadatos (título, foto para WhatsApp/Google) se resuelven acá en el servidor
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    const title = `${product.name} — Natbell`;
    const description = (product.description || `${product.name} en Natbell, cosmética profesional.`).slice(0, 160);
    const original = product.image_urls?.[0];
    // La foto de vista previa pasa por el optimizador de Vercel (cacheada) en vez de bajarse directo de Supabase
    const image = original ? `${SITE_URL}/_next/image?url=${encodeURIComponent(original)}&w=1200&q=75` : undefined;
    return {
      title,
      description,
      openGraph: { title, description, images: image ? [image] : undefined, type: "website" },
    };
  } catch {
    return { title: "Producto — Natbell" };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
