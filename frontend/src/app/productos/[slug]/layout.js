import { getProductBySlug } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import { productImageSrc } from "@/lib/utils";

// La página es "use client": los metadatos (título, foto para WhatsApp/Google) se resuelven acá en el servidor
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    const title = `${product.name} — Natbell`;
    const description = (product.description || `${product.name} en Natbell, cosmética profesional.`).slice(0, 160);
    const original = product.image_urls?.[0];
    // La foto original vía el proxy /img (cacheada en Vercel): sin WebP, que algunas apps no muestran en la vista previa
    const src = original ? productImageSrc(original) : undefined;
    const image = src?.startsWith("/") ? `${SITE_URL}${src}` : src;
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
