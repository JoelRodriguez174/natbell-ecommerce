"use client";

import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
  ...props
}) {
  const variantMap = {
    sale: {
      color: "danger",
      variant: "flat",
      className:
        "bg-red-50 text-red-700 border border-red-200 font-bold tracking-wider text-[10px]",
    },
    featured: {
      color: "warning",
      variant: "flat",
      className:
        "bg-amber-50 text-amber-800 text-amber-300 border border-amber-300 font-bold tracking-wider text-[10px]",
    },
    stock: {
      color: "success",
      variant: "flat",
      className:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]",
    },
    outOfStock: {
      color: "default",
      variant: "flat",
      className:
        "bg-gray-100 text-gray-500 border border-gray-200 font-medium text-[11px]",
    },
    neutral: {
      color: "default",
      variant: "flat",
      className:
        "bg-gray-50 text-gray-700 border border-gray-200 font-medium text-[11px]",
    },
    brand: {
      color: "secondary",
      variant: "flat",
      className:
        "bg-rose-50 text-rose-700 border border-rose-200 font-semibold tracking-wider text-[10px]",
    },
  };

  const current = variantMap[variant] || variantMap.neutral;

  return (
    <Chip
      size={size === "xs" ? "sm" : size}
      color={current.color}
      variant={current.variant}
      radius="sm"
      className={cn(current.className, className)}
      {...props}
    >
      {children}
    </Chip>
  );
}
