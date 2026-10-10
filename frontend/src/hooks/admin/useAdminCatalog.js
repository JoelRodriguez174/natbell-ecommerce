import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// --- FETCHERS ---
const fetchProducts = async (search = "", token) => {
  const params = new URLSearchParams({ per_page: 1000 });
  if (search) params.append("search", search);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/api/admin/products?${params.toString()}`, { headers });
  if (!res.ok) throw new Error("Error fetching admin products");
  const data = await res.json();
  return data.items || [];
};

const fetchCategories = async () => {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Error fetching categories");
  return res.json();
};

const fetchBrands = async () => {
  const res = await fetch(`${API_URL}/api/brands`);
  if (!res.ok) throw new Error("Error fetching brands");
  return res.json();
};

// --- HOOKS ---

export function useCatalogData(search = "") {
  const token = useAdminAuthStore((s) => s.token);

  const productsQuery = useQuery({
    queryKey: ["admin_products", search],
    queryFn: () => fetchProducts(search, token),
    staleTime: 0,
    enabled: !!token,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin_categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const brandsQuery = useQuery({
    queryKey: ["admin_brands"],
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: productsQuery.data || [],
    categories: categoriesQuery.data || [],
    brands: brandsQuery.data || [],
    isLoading:
      productsQuery.isLoading ||
      categoriesQuery.isLoading ||
      brandsQuery.isLoading,
    isError:
      productsQuery.isError || categoriesQuery.isError || brandsQuery.isError,
    refetchProducts: productsQuery.refetch,
  };
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const token = useAdminAuthStore((s) => s.token);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const createProduct = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al crear producto");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ productId, payload, variantId, stock }) => {
      // Update product details
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al actualizar producto");
      }

      // Update variant stock if needed
      if (variantId && stock !== undefined) {
        await fetch(`${API_URL}/api/admin/variants/${variantId}/stock`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ stock: parseInt(stock, 10) || 0 }),
        });
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId) => {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al eliminar producto");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  const bulkDeleteProducts = useMutation({
    mutationFn: async (productIds) => {
      const res = await fetch(`${API_URL}/api/admin/products/bulk-delete`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ product_ids: productIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al eliminar productos seleccionados");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  const createVariant = useMutation({
    mutationFn: async ({ productId, payload }) => {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al añadir variante");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    createVariant,
  };
}

