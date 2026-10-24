import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, sanitizeQuery, buildQueryString, cn, skipImageOptimization, productImageSrc, productImageLoader } from "../src/lib/utils";

describe("Frontend Utils", () => {
  describe("formatDate", () => {
    it("formatea correctamente una fecha ISO a string legible", () => {
      const formatted = formatDate("2026-09-16T12:00:00Z");
      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("retorna string vacío ante valores inválidos o nulos", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("fecha-invalida")).toBe("");
    });
  });

  describe("formatCurrency", () => {
    it("formatea correctamente números enteros a Pesos Argentinos", () => {
      const result = formatCurrency(12500);
      expect(result).toMatch(/\$\s?12\.500/);
    });

    it("maneja valores nulos o indefinidos con fallback a $ 0", () => {
      expect(formatCurrency(null)).toMatch(/\$\s?0/);
      expect(formatCurrency(undefined)).toMatch(/\$\s?0/);
      expect(formatCurrency("invalido")).toMatch(/\$\s?0/);
    });
  });

  describe("sanitizeQuery", () => {
    it("elimina caracteres peligrosos para prevención de XSS", () => {
      const dirty = "<script>alert('xss');</script>";
      const clean = sanitizeQuery(dirty);
      expect(clean).not.toContain("<");
      expect(clean).not.toContain(">");
      expect(clean).not.toContain("'");
      expect(clean).not.toContain(";");
    });

    it("recorta espacios y limita a 100 caracteres", () => {
      const longString = "  " + "a".repeat(120) + "  ";
      const clean = sanitizeQuery(longString);
      expect(clean.length).toBe(100);
    });
  });

  describe("buildQueryString", () => {
    it("construye un query string excluyendo valores nulos o vacíos", () => {
      const params = {
        category: "shampoo",
        brand: "",
        min_price: 1000,
        empty: null,
      };
      const qs = buildQueryString(params);
      expect(qs).toBe("?category=shampoo&min_price=1000");
    });

    it("retorna string vacío si el objeto no tiene parámetros válidos", () => {
      expect(buildQueryString({})).toBe("");
      expect(buildQueryString({ a: "", b: null })).toBe("");
    });
  });

  describe("cn", () => {
    it("combina clases condicionales", () => {
      expect(cn("base", true && "active", false && "disabled")).toBe("base active");
    });
  });

  describe("skipImageOptimization", () => {
    it("optimiza Supabase y rutas locales, salta otros dominios externos", () => {
      expect(skipImageOptimization("https://abc.supabase.co/storage/v1/object/public/products/x.jpg")).toBe(false);
      expect(skipImageOptimization("/products/shampoo.webp")).toBe(false);
      expect(skipImageOptimization("https://http2.mlstatic.com/foto.jpg")).toBe(true);
      expect(skipImageOptimization(undefined)).toBe(false);
    });
  });

  describe("productImageSrc", () => {
    it("convierte las URLs públicas de Supabase al proxy /img y deja el resto igual", () => {
      expect(productImageSrc("https://abc.supabase.co/storage/v1/object/public/products/a1_foto.jpg")).toBe("/img/a1_foto.jpg");
      expect(productImageSrc("https://abc.supabase.co/storage/v1/object/public/products/a1_foto.jpg?")).toBe("/img/a1_foto.jpg");
      expect(productImageSrc("https://http2.mlstatic.com/foto.jpg")).toBe("https://http2.mlstatic.com/foto.jpg");
      expect(productImageSrc("/products/shampoo.webp")).toBe("/products/shampoo.webp");
      expect(productImageSrc(undefined)).toBe(undefined);
    });
  });

  describe("productImageLoader", () => {
    it("las fotos de /img las achica el proxy y el resto va al optimizador de Next", () => {
      expect(productImageLoader({ src: "/img/a1_foto.jpg", width: 640, quality: 90 })).toBe("/img/a1_foto.jpg?w=640");
      expect(productImageLoader({ src: "/products/shampoo.webp", width: 128 })).toBe(
        "/_next/image?url=%2Fproducts%2Fshampoo.webp&w=128&q=75"
      );
    });
  });
});
