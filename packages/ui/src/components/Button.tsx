import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
}

/**
 * Button component
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" isLoading>Loading...</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          isLoading && 'btn-loading',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/** Loading spinner for button */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
    />
  );
}

