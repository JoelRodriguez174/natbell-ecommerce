import { buildQueryString } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Cliente HTTP base para llamadas a FastAPI
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.detail || `Error del servidor (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return await res.json();
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("No se pudo conectar con el servidor backend (FastAPI)");
    }
    throw err;
  }
}

/**
 * Listado paginado de productos con filtros
 */
export async function getProducts(params = {}) {
  const query = buildQueryString(params);
  return apiFetch(`/api/products${query}`);
}

/**
 * Detalle completo de un producto por su slug
 */
export async function getProductBySlug(slug) {
  if (!slug) throw new Error("Slug de producto no proporcionado");
  return apiFetch(`/api/products/${encodeURIComponent(slug)}`);
}

/**
 * Productos destacados para el Home
 */
export async function getFeaturedProducts(limit = 8) {
  return apiFetch(`/api/products/featured?limit=${limit}`);
}

/**
 * Productos en oferta
 */
export async function getOnSaleProducts(limit = 8) {
  return apiFetch(`/api/products/on-sale?limit=${limit}`);
}

/**
 * Búsqueda de productos por coincidencia de texto
 */
export async function searchProducts(q, limit = 20) {
  if (!q || !q.trim()) return [];
  const query = buildQueryString({ q: q.trim(), limit });
  return apiFetch(`/api/products/search${query}`);
}

/**
 * Árbol de categorías con sus subcategorías (soporta filtro por ?brand=slug)
 */
export async function getCategories(params = {}) {
  const query = buildQueryString(params);
  return apiFetch(`/api/categories${query}`);
}

/**
 * Listado de marcas comerciales (soporta filtro por ?category=slug)
 */
export async function getBrands(params = {}) {
  const query = buildQueryString(params);
  return apiFetch(`/api/brands${query}`);
}

/**
 * Cotización de costo de envío por código postal
 */
export async function getShippingQuote(postalCode) {
  if (!postalCode || !postalCode.toString().trim()) {
    throw new Error("El código postal es requerido");
  }
  const query = buildQueryString({ postal_code: postalCode.toString().trim() });
  return apiFetch(`/api/shipping/quote${query}`);
}

/**
 * Listado de zonas de envío configuradas
 */
export async function getShippingZones() {
  return apiFetch(`/api/shipping/zones`);
}

/**
 * Crea un nuevo pedido en la pasarela / API de órdenes (Guest Checkout)
 */
export async function createOrder(orderPayload) {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
}

/**
 * Consulta el estado público y detalle de un pedido por su identificador ORD-YYYY-NNNNN
 */
export async function getOrderStatus(orderNumber) {
  if (!orderNumber) throw new Error("Número de orden requerido");
  return apiFetch(`/api/orders/${encodeURIComponent(orderNumber)}/status`);
}

/**
 * Descarta un intento de compra pendiente cuando el cliente cancela o retrocede
 */
export async function deleteDraftOrder(orderNumber) {
  if (!orderNumber) return null;
  try {
    return await apiFetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
      method: "DELETE",
    });
  } catch (err) {
    // Si la orden ya no existe o falló, no interrumpir la navegación del usuario
    console.warn("No se pudo descartar orden preliminar:", err);
    return null;
  }
}
