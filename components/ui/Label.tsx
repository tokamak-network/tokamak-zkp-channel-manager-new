/**
 * Label Component
 *
 * Figma Design based label component
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

"use client";

import { forwardRef, LabelHTMLAttributes, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  hint?: string;
  hintIcon?: ReactNode;
  tooltip?: string;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, hint, hintIcon, tooltip, children, ...props }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label
            ref={ref}
            className={cn("text-lg font-medium font-mono text-[#111111]", className)}
            {...props}
          >
            {children}
          </label>
          {hintIcon && (
            <div
              className="relative cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {hintIcon}
              {tooltip && showTooltip && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50"
                  style={{ width: "max-content", maxWidth: 280 }}
                >
                  <div className="bg-[#111111] text-white text-sm font-mono px-3 py-2 rounded shadow-lg">
                    {tooltip}
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#111111]" />
                </div>
              )}
            </div>
          )}
        </div>
        {hint && <span className="text-lg font-mono text-[#666666]">{hint}</span>}
      </div>
    );
  }
);

Label.displayName = "Label";

export { Label };
