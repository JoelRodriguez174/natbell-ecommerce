import sharp from "sharp";
import { IMG_PROXY_WIDTHS } from "@/lib/imageSizes.mjs";

// Proxy de las fotos del bucket privado "products" de Supabase.
// Solo este servidor tiene la clave: los robots que usan las URLs directas de Supabase reciben error,
// y Vercel cachea cada foto 1 año (nombres únicos por subida), así Supabase la entrega una sola vez.
// Con ?w= la achica acá a WebP en vez de usar /_next/image: no gasta transformaciones de Vercel (límite del plan Hobby).
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://swozzogsoxahbcpxhujk.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";
const WEBP_QUALITY = 80;
const CACHE_1_YEAR = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(request, { params }) {
  const { path = [] } = await params;
  if (!path.length || path.some((seg) => seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return new Response("Bad request", { status: 400 });
  }
  // Solo anchos conocidos: si no, cualquiera podría generar variantes infinitas (cada una es una ejecución + caché)
  const wParam = new URL(request.url).searchParams.get("w");
  const width = wParam === null ? null : Number(wParam);
  if (width !== null && !IMG_PROXY_WIDTHS.includes(width)) {
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
  const contentType = upstream.headers.get("content-type") || "application/octet-stream";

  if (width === null) {
    return new Response(upstream.body, {
      headers: { "Content-Type": contentType, "Cache-Control": CACHE_1_YEAR, "X-Content-Type-Options": "nosniff" },
    });
  }

  const original = Buffer.from(await upstream.arrayBuffer());
  let body = original;
  let type = contentType;
  try {
    body = await sharp(original)
      .rotate() // respeta la orientación EXIF
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    type = "image/webp";
  } catch {
    // Si no se puede decodificar, se entrega el original tal cual
  }
  return new Response(body, {
    headers: { "Content-Type": type, "Cache-Control": CACHE_1_YEAR, "X-Content-Type-Options": "nosniff" },
  });
}
