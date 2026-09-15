import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Genera una clave compuesta única para el item en el carrito:
 * `productId_variantId` para soportar variantes múltiples del mismo producto.
 */
export function getCartItemKey(productId, variantId = null) {
  return `${productId}_${variantId || "default"}`;
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Control de visibilidad del CartDrawer
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      /**
       * Agrega un producto (y su variante opcional) al carrito.
       * Si el producto ya existe en el carrito, incrementa la cantidad respetando el stock disponible.
       */
      addItem: (product, variant = null, quantity = 1) => {
        if (!product || !product.id) return;

        const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
        const variantId = variant?.id || null;
        const itemKey = getCartItemKey(product.id, variantId);

        // Determinación de precio reactivo
        const effectivePrice =
          variant?.price_override != null
            ? Number(variant.price_override)
            : product.is_on_sale && product.sale_price
            ? Number(product.sale_price)
            : Number(product.base_price || 0);

        // Determinación de imagen principal
        const image =
          (product.image_urls && product.image_urls.length > 0 && product.image_urls[0]) ||
          (product.images && product.images.length > 0 && product.images[0]) ||
          (product.slug ? `/products/${product.slug}.webp` : null);

        // Stock disponible
        const availableStock =
          variant?.stock != null
            ? Number(variant.stock)
            : product.stock != null
            ? Number(product.stock)
            : 50;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.itemKey === itemKey);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          const existingItem = updatedItems[existingIndex];
          const newQty = Math.min(
            existingItem.quantity + qtyToAdd,
            Math.max(1, availableStock)
          );

          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            price: effectivePrice,
            maxStock: availableStock,
          };

          set({ items: updatedItems, isOpen: true });
        } else {
          const newItem = {
            itemKey,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brandName: product.brand_name || null,
            categoryName: product.category_name || null,
            variantId,
            variantName: variant?.name || variant?.attribute_value || null,
            variantSku: variant?.sku || null,
            price: effectivePrice,
            image,
            quantity: Math.min(qtyToAdd, Math.max(1, availableStock)),
            maxStock: availableStock,
            addedAt: new Date().toISOString(),
          };

          set({ items: [...currentItems, newItem], isOpen: true });
        }
      },

      /**
       * Elimina un ítem específico del carrito mediante su itemKey.
       */
      removeItem: (itemKey) => {
        set((state) => ({
          items: state.items.filter((i) => i.itemKey !== itemKey),
        }));
      },

      /**
       * Actualiza la cantidad de un ítem existente.
       * Si la cantidad es <= 0, elimina el ítem del carrito.
       */
      updateQuantity: (itemKey, newQuantity) => {
        const qty = parseInt(newQuantity, 10);
        if (isNaN(qty) || qty <= 0) {
          get().removeItem(itemKey);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.itemKey === itemKey) {
              const clampedQty = Math.min(qty, Math.max(1, item.maxStock || 99));
              return { ...item, quantity: clampedQty };
            }
            return item;
          }),
        }));
      },

      /**
       * Vacía por completo el carrito.
       */
      clearCart: () => set({ items: [] }),

      /**
       * Cantidad total de unidades sumadas de todos los productos en el carrito.
       */
      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
      },

      /**
       * Subtotal monetario en pesos de los ítems en el carrito.
       */
      getSubtotal: () => {
        return get().items.reduce(
          (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
          0
        );
      },
    }),
    {
      name: "natbell_cart_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
