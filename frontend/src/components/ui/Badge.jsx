"use client";

import React from "react";

export default function Badge({
  children,
  variant = "slate",
  className = "",
  size = "md",
}) {
  const variants = {
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    outline: "bg-transparent text-slate-600 border-slate-300",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
    lg: "text-sm px-3 py-1.5 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border tracking-wide uppercase ${
        variants[variant] || variants.slate
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}
