import { describe, it, expect } from "vitest";
import { formatCurrency, sanitizeQuery, buildQueryString, cn } from "../src/lib/utils";

describe("Frontend Utils", () => {
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
});
