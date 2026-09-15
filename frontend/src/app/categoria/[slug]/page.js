import { redirect } from "next/navigation";

export default async function CategoriaPage({ params }) {
  const { slug } = await params;
  redirect(`/productos?category=${encodeURIComponent(slug)}`);
}
