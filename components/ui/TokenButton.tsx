/**
 * TokenButton Component
 *
 * Figma Design based token selection button (pill shape)
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TokenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: ReactNode;
}

const TokenButton = forwardRef<HTMLButtonElement, TokenButtonProps>(
  ({ className, selected, disabled, icon, children, ...props }, ref) => {
    const baseStyles =
      "flex items-center gap-1.5 px-5 py-2 h-12 rounded-full font-mono font-medium text-lg transition-colors";

    const stateStyles = disabled
      ? "bg-[#999999] cursor-not-allowed"
      : selected
        ? "bg-[#2A72E5]"
        : "bg-[#F2F2F2] hover:bg-[#E5E5E5]";

    const textStyles = disabled
      ? "text-[#DCDCDC]"
      : selected
        ? "text-white"
        : "text-[#111111]";

    return (
      <button
        ref={ref}
        type="button"
        className={cn(baseStyles, stateStyles, textStyles, className)}
        disabled={disabled}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              disabled ? "bg-white/50" : "bg-white"
            )}
          >
            {icon}
          </div>
        )}
        {children}
      </button>
    );
  }
);

TokenButton.displayName = "TokenButton";

export { TokenButton };
