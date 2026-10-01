import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "../../../store/useAdminAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- FETCHERS ---
const fetchProducts = async (search = "") => {
  const params = new URLSearchParams({ per_page: 50 });
  if (search) params.append("search", search);

  const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
  if (!res.ok) throw new Error("Error fetching products");
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
  const productsQuery = useQuery({
    queryKey: ["admin_products", search],
    queryFn: () => fetchProducts(search),
    staleTime: 60 * 1000,
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
    createVariant,
  };
}
