import { getProductBySlug } from "@/lib/api";

// La página es "use client": los metadatos (título, foto para WhatsApp/Google) se resuelven acá en el servidor
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    const title = `${product.name} — Natbell`;
    const description = (product.description || `${product.name} en Natbell, cosmética profesional.`).slice(0, 160);
    const image = product.image_urls?.[0];
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
