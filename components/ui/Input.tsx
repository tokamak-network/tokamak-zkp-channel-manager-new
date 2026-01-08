import { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Input - 공통 인풋 컴포넌트
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

