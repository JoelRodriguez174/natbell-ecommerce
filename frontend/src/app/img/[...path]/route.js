// Proxy de las fotos del bucket privado "products" de Supabase.
// Solo este servidor tiene la clave: los robots que usan las URLs directas de Supabase reciben error,
// y Vercel cachea cada foto 1 año (nombres únicos por subida), así Supabase la entrega una sola vez.
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://swozzogsoxahbcpxhujk.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";

export async function GET(_request, { params }) {
  const { path = [] } = await params;
  if (!path.length || path.some((seg) => seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return new Response("Bad request", { status: 400 });
  }

  const objectPath = path.map(encodeURIComponent).join("/");
  const headers = {};
  if (SUPABASE_KEY) {
    headers.apikey = SUPABASE_KEY;
    // Las claves anon "legacy" son JWT y van también como Bearer; las nuevas sb_publishable_ solo como apikey
    if (SUPABASE_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }
  // Sin clave configurada se usa la ruta pública (sirve mientras el bucket siga público)
  const url = SUPABASE_KEY
    ? `${SUPABASE_URL}/storage/v1/object/authenticated/products/${objectPath}`
    : `${SUPABASE_URL}/storage/v1/object/public/products/${objectPath}`;

  const upstream = await fetch(url, { headers, cache: "no-store" });
  if (!upstream.ok) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
