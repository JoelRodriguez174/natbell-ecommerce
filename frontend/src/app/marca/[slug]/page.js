import { redirect } from "next/navigation";

export default async function MarcaPage({ params }) {
  const { slug } = await params;
  redirect(`/productos?brand=${encodeURIComponent(slug)}`);
}
