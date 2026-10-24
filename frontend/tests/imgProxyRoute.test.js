// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadRoute(env = {}) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("../src/app/img/[...path]/route.js");
}

const call = (GET, path, query = "") =>
  GET(new Request(`http://test/img${query}`), { params: Promise.resolve({ path }) });

describe("Proxy de imágenes /img", () => {
  it("pide la foto al bucket privado con la clave y la devuelve cacheable por 1 año", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("jpgdata", { headers: { "content-type": "image/jpeg" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await loadRoute({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "eyJtest" });

    const res = await call(GET, ["a1_foto producto.jpg"]);

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=31536000");
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://x.supabase.co/storage/v1/object/authenticated/products/a1_foto%20producto.jpg");
    expect(opts.headers.apikey).toBe("eyJtest");
    expect(opts.headers.Authorization).toBe("Bearer eyJtest");
  });

  it("rechaza rutas que intentan salir del bucket", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { GET } = await loadRoute({ SUPABASE_ANON_KEY: "k" });
    expect((await call(GET, ["..", "otro-bucket", "x.jpg"])).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("con ?w= achica la foto a WebP en el servidor (sin usar /_next/image)", async () => {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp({ create: { width: 1000, height: 500, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(jpg, { headers: { "content-type": "image/jpeg" } })));
    const { GET } = await loadRoute({ SUPABASE_ANON_KEY: "k" });

    const res = await call(GET, ["foto.jpg"], "?w=256");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toContain("s-maxage=31536000");
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect(meta.width).toBe(256);
  });

  it("rechaza anchos que no están en la lista para no generar variantes infinitas", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { GET } = await loadRoute({ SUPABASE_ANON_KEY: "k" });
    expect((await call(GET, ["foto.jpg"], "?w=500")).status).toBe(400);
    expect((await call(GET, ["foto.jpg"], "?w=abc")).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("devuelve 404 si Supabase no tiene la foto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 400 })));
    const { GET } = await loadRoute({ SUPABASE_ANON_KEY: "sb_publishable_x" });
    expect((await call(GET, ["nada.jpg"])).status).toBe(404);
  });
});
