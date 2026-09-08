"use client";

import React from "react";

export default function Input({
  label,
  error,
  icon: Icon,
  className = "",
  id,
  type = "text",
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-50 disabled:text-slate-500 ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-200 hover:border-slate-300"
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-0.5">{error}</p>}
    </div>
  );
}
