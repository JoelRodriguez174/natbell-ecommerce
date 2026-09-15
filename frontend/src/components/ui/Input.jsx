"use client";

import { forwardRef } from "react";
import { Input as HeroInput } from "@heroui/react";
import { cn } from "@/lib/utils";

const Input = forwardRef(
  (
    {
      className = "",
      type = "text",
      leftIcon,
      rightIcon,
      startContent,
      endContent,
      error,
      disabled = false,
      isDisabled,
      ...props
    },
    ref
  ) => {
    const isInputDisabled = Boolean(disabled || isDisabled);
    const leadingIcon = leftIcon || startContent;
    const trailingIcon = rightIcon || endContent;

    return (
      <div className="relative w-full">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-10">
            {leadingIcon}
          </div>
        )}
        <HeroInput
          ref={ref}
          type={type}
          disabled={isInputDisabled}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm rounded-lg",
            "focus:border-black focus:ring-1 focus:ring-black transition-all py-2 shadow-xs",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "hover:border-gray-400",
            leadingIcon ? "!pl-10" : "!pl-3.5",
            trailingIcon ? "!pr-10" : "!pr-3.5",
            className
          )}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 z-10">
            {trailingIcon}
          </div>
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
