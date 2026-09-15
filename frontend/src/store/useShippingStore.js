import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useShippingStore = create(
  persist(
    (set) => ({
      postalCode: "",
      quote: null,
      isLoading: false,
      error: null,

      setPostalCode: (postalCode) => set({ postalCode }),
      setQuote: (quote) => set({ quote, error: null, isLoading: false }),
      setError: (error) => set({ error, quote: null, isLoading: false }),
      setIsLoading: (isLoading) => set({ isLoading }),
      clearShipping: () => set({ postalCode: "", quote: null, error: null, isLoading: false }),
    }),
    {
      name: "natbell_shipping_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
