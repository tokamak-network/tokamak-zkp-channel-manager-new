/**
 * Label Component
 *
 * Figma Design based label component
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

import { forwardRef, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  hint?: string;
  hintIcon?: ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, hint, hintIcon, children, ...props }, ref) => {
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
          {hintIcon}
        </div>
        {hint && <span className="text-lg font-mono text-[#666666]">{hint}</span>}
      </div>
    );
  }
);

Label.displayName = "Label";

export { Label };
