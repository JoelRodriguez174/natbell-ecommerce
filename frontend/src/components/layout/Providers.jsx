"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Providers({ children }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos de caché
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <RouterProvider navigate={router.push}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RouterProvider>
  );
}
