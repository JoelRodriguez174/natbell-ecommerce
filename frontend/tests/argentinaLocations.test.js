import { describe, it, expect } from "vitest";
import {
  ARGENTINA_PROVINCES,
  ARGENTINA_CITIES_BY_PROVINCE,
  ARGENTINA_POSTAL_CODES_BY_CITY,
  getDefaultPostalCode,
} from "../src/lib/argentinaLocations";

describe("argentinaLocations Postal Codes Mapping", () => {
  it("cada ciudad de cada provincia tiene su código postal predefinido asignado", () => {
    ARGENTINA_PROVINCES.forEach((province) => {
      const cities = ARGENTINA_CITIES_BY_PROVINCE[province] || [];
      expect(cities.length).toBeGreaterThan(0);

      cities.forEach((city) => {
        const cp = getDefaultPostalCode(province, city);
        expect(cp).toBeTruthy();
        expect(cp).toMatch(/^\d{4}$/); // Código postal argentino estándar de 4 dígitos
      });
    });
  });

  it("retorna los códigos postales exactos para ciudades clave", () => {
    expect(getDefaultPostalCode("Ciudad Autónoma de Buenos Aires (CABA)", "Palermo")).toBe("1425");
    expect(getDefaultPostalCode("Buenos Aires", "Mar del Plata")).toBe("7600");
    expect(getDefaultPostalCode("Córdoba", "Córdoba Capital")).toBe("5000");
    expect(getDefaultPostalCode("Santa Fe", "Rosario")).toBe("2000");
    expect(getDefaultPostalCode("Mendoza", "Mendoza Capital")).toBe("5500");
    expect(getDefaultPostalCode("San Luis", "Villa Mercedes")).toBe("5730");
    expect(getDefaultPostalCode("Tucumán", "San Miguel de Tucumán")).toBe("4000");
  });

  it("retorna string vacío si la ciudad es OTRA o inexistente", () => {
    expect(getDefaultPostalCode("Buenos Aires", "OTRA")).toBe("");
    expect(getDefaultPostalCode("Buenos Aires", "")).toBe("");
    expect(getDefaultPostalCode("", "Rosario")).toBe("");
    expect(getDefaultPostalCode("Buenos Aires", "Ciudad Fantasma")).toBe("");
  });
});
