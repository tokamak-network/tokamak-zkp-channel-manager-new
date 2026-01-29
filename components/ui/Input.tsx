/**
 * Input Component
 *
 * Figma Design based input component
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210381
 */

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  rightIcon?: ReactNode;
  /** Test ID for E2E testing */
  testId?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, disabled, readOnly, rightIcon, testId, ...props }, ref) => {
    // Base input styles
    // - Font: 18px for entered value, 20px placeholder
    // - Padding: 14px 16px
    const baseStyles =
      "w-full py-3.5 px-4 rounded border font-mono text-lg placeholder:text-xl placeholder:text-[#999999] transition-colors outline-none";

    const stateStyles = error
      ? "border-red-500 bg-red-50 focus:border-red-500"
      : success
        ? "border-[#3EB100] bg-white focus:border-[#3EB100]"
        : disabled || readOnly
          ? "bg-[#F2F2F2] text-[#999999] border-[#BBBBBB] cursor-not-allowed"
          : "bg-white text-[#111111] border-[#BBBBBB] focus:border-[#2A72E5]";

    // If there's a right icon, wrap in a container
    if (rightIcon) {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            className={cn(baseStyles, stateStyles, "pr-12", className)}
            disabled={disabled}
            readOnly={readOnly}
            data-testid={testId}
            {...props}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(baseStyles, stateStyles, className)}
        disabled={disabled}
        readOnly={readOnly}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
