"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "losarrayanes_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isHydrated]);

  const addItem = (product, variant, quantity = 1) => {
    setItems((prevItems) => {
      const variantId = variant?.id || product.id;
      const existingIndex = prevItems.findIndex((it) => it.variant_id === variantId);

      const price = variant?.price_override
        ? Number(variant.price_override)
        : Number(product.sale_price || product.base_price);

      const maxStock = variant?.stock ?? 999;
      const image = product.image_urls?.[0] || "/placeholder-product.png";

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex];
        const newQuantity = Math.min(existing.quantity + quantity, maxStock);
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
        };
        return updated;
      } else {
        const newItem = {
          product_id: product.id,
          variant_id: variantId,
          product_name: product.name,
          variant_name: variant?.variant_name || "Estándar",
          sku: variant?.sku || "SKU-GEN",
          price: price,
          image: image,
          quantity: Math.min(quantity, maxStock),
          max_stock: maxStock,
        };
        return [...prevItems, newItem];
      }
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (variantId) => {
    setItems((prev) => prev.filter((it) => it.variant_id !== variantId));
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.variant_id === variantId) {
          const qty = Math.min(newQuantity, it.max_stock);
          return { ...it, quantity: qty };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
