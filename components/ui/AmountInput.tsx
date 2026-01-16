/**
 * AmountInput Component
 *
 * Token amount input with balance display, max button, and token selector
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-211134
 */

"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  balance?: string;
  tokenSymbol?: string;
  onMaxClick?: () => void;
  onTokenSelect?: () => void;
  error?: boolean;
  label?: string;
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      value,
      onChange,
      balance = "0",
      tokenSymbol = "TON",
      onMaxClick,
      onTokenSelect,
      error,
      label = "Amount",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-3 font-mono w-full">
        {/* Label */}
        <label
          className="font-medium text-[#111111]"
          style={{ fontSize: 18, lineHeight: "1.3em" }}
        >
          {label}
        </label>

        {/* Input Container */}
        <div
          className="w-full flex items-center justify-between"
          style={{
            border: error ? "1px solid #FF0000" : "1px solid #5F5F5F",
            borderRadius: 4,
            padding: "16px 24px",
            minHeight: 100,
          }}
        >
          {/* Left: Amount Input */}
          <input
            ref={ref}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            disabled={disabled}
            className="font-medium bg-transparent outline-none flex-1 min-w-0 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{
              fontSize: 48,
              lineHeight: "1em",
              color: value ? "#2A72E5" : "#999999",
              maxWidth: "50%",
            }}
            {...props}
          />

          {/* Right: Token Selector + Balance/Max */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Token Selector (top right) */}
            <button
              type="button"
              onClick={onTokenSelect}
              disabled={disabled || !onTokenSelect}
              className="flex items-center gap-2 transition-colors hover:opacity-80 disabled:cursor-default"
              style={{
                backgroundColor: "#DDDDDD",
                border: "1px solid #9A9A9A",
                borderRadius: 40,
                padding: "8px 12px",
                height: 40,
              }}
            >
              <div
                className="flex items-center justify-center bg-white rounded-full"
                style={{ width: 24, height: 24 }}
              >
                <span className="text-[#2A72E5] font-bold text-xs">T</span>
              </div>
              <span
                className="text-[#111111]"
                style={{ fontSize: 18, lineHeight: "1.3em" }}
              >
                {tokenSymbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#999999]" />
            </button>

            {/* Balance + Max (bottom right) */}
            <div className="flex items-center gap-2">
              <span
                className="font-medium text-[#111111]"
                style={{ fontSize: 16 }}
              >
                Balance: {balance}
              </span>
              {onMaxClick && (
                <button
                  type="button"
                  onClick={onMaxClick}
                  disabled={disabled}
                  className="font-medium text-[#2A72E5] bg-white transition-colors hover:bg-[#F2F2F2] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid #2A72E5",
                    borderRadius: 4,
                    padding: "3px 10px",
                    fontSize: 16,
                  }}
                >
                  Max
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";

export { AmountInput };
