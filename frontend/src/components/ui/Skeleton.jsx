"use client";

import React from "react";

export default function Skeleton({ className = "", rounded = "rounded-xl" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${rounded} ${className}`}
    />
  );
}
