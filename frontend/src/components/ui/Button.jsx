"use client";

import { forwardRef } from "react";
import { Button as HeroButton } from "@heroui/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      isDisabled,
      leftIcon,
      rightIcon,
      startContent,
      endContent,
      className = "",
      onPress,
      onClick,
      ...props
    },
    ref
  ) => {
    const variantConfig = {
      primary: {
        variant: "solid",
        className:
          "bg-zinc-900 hover:bg-black text-white font-medium shadow-sm active:scale-[0.99] transition-all rounded-lg",
      },
      secondary: {
        variant: "flat",
        className:
          "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 active:scale-[0.99] transition-all rounded-lg",
      },
      outline: {
        variant: "bordered",
        className:
          "border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-all rounded-lg",
      },
      ghost: {
        variant: "light",
        className: "text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg",
      },
      danger: {
        variant: "flat",
        className: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg",
      },
      accent: {
        variant: "solid",
        className:
          "bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm active:scale-[0.99] transition-all rounded-lg",
      },
    };

    const cfg = variantConfig[variant] || variantConfig.primary;
    const isButtonDisabled = Boolean(disabled || isDisabled || isLoading);

    return (
      <HeroButton
        ref={ref}
        variant={cfg.variant}
        size={size}
        isDisabled={isButtonDisabled}
        onPress={onPress || onClick}
        className={cn(cfg.className, className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          (leftIcon || startContent) && (
            <span className="inline-flex shrink-0">{leftIcon || startContent}</span>
          )
        )}
        <span className="inline-flex items-center gap-1.5">{children}</span>
        {!isLoading && (rightIcon || endContent) && (
          <span className="inline-flex shrink-0">{rightIcon || endContent}</span>
        )}
      </HeroButton>
    );
  }
);

Button.displayName = "Button";
export default Button;
