"use client";

import { Skeleton as HeroSkeleton } from "@heroui/react";
import { cn } from "@/lib/utils";

export default function Skeleton({
  children,
  className = "",
  isLoaded = false,
  ...props
}) {
  if (isLoaded) {
    return children;
  }

  return (
    <HeroSkeleton
      className={cn(
        "bg-slate-800/60 rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </HeroSkeleton>
  );
}
