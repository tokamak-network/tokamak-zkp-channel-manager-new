/**
 * Button Component
 *
 * Figma Design based button component
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg" | "full";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const baseStyles =
      "font-mono font-medium rounded border transition-colors flex items-center justify-center";

    const variantStyles = {
      primary: disabled
        ? "bg-[#999999] text-[#DCDCDC] border-[#111111] cursor-not-allowed"
        : "bg-[#2A72E5] text-white border-[#111111] hover:bg-[#1a5fc7]",
      secondary: disabled
        ? "bg-[#F2F2F2] text-[#999999] border-[#BBBBBB] cursor-not-allowed"
        : "bg-[#F2F2F2] text-[#111111] border-[#BBBBBB] hover:bg-[#E5E5E5]",
      outline: disabled
        ? "bg-transparent text-[#999999] border-[#BBBBBB] cursor-not-allowed"
        : "bg-transparent text-[#111111] border-[#111111] hover:bg-[#F2F2F2]",
    };

    const sizeStyles = {
      sm: "h-10 px-4 text-base",
      md: "h-12 px-6 text-lg",
      lg: "h-14 px-6 text-xl",
      full: "h-14 px-6 text-xl w-full",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
