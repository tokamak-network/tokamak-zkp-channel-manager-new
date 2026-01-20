import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Input size */
  inputSize?: InputSize;
}

/**
 * Input component with label and error handling
 *
 * @example
 * <Input label="Email" placeholder="Enter email" />
 * <Input label="Password" type="password" error="Required" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, inputSize = 'md', className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    const sizeClass = {
      sm: 'input-sm',
      md: '',
      lg: 'input-lg',
    }[inputSize];

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className={cn('label', error && 'label-error')}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('input', sizeClass, error && 'input-error', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

