import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'default';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button color theme */
  color?: ButtonColor;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Test ID for E2E testing */
  testId?: string;
}

/**
 * Button component with unified styling
 * 
 * All buttons have consistent border and background colors to clearly indicate they are actionable.
 * Use variant and color props to control styling instead of className overrides.
 *
 * @example
 * // Primary buttons with different colors
 * <Button variant="primary" color="blue">Upload</Button>
 * <Button variant="primary" color="green">Download</Button>
 * <Button variant="primary" color="red">Delete</Button>
 * 
 * // Outline buttons with colors
 * <Button variant="outline" color="blue">Verify</Button>
 * <Button variant="outline" color="red">Cancel</Button>
 * 
 * // With size
 * <Button variant="primary" color="green" size="sm">Small Button</Button>
 * 
 * // Loading state
 * <Button variant="primary" color="blue" isLoading>Loading...</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      color = 'default',
      size = 'md',
      isLoading = false,
      className,
      children,
      disabled,
      testId,
      ...props
    },
    ref
  ) => {
    // Determine color class based on variant and color
    // Danger variant always uses red and ignores color prop
    let colorClass: string;
    if (variant === 'danger') {
      colorClass = 'btn-danger';
    } else if (variant === 'outline' || variant === 'ghost') {
      colorClass = `btn-${variant}-${color}`;
    } else if (variant === 'primary' || variant === 'secondary') {
      colorClass = `btn-${variant}-${color}`;
    } else {
      colorClass = `btn-${variant}`;
    }

    // Add inline styles to ensure buttons are visible with proper styling
    const inlineStyle: React.CSSProperties = {};
    
    // Apply background, border, and padding based on variant
    if (variant === 'primary') {
      if (color === 'blue') {
        inlineStyle.backgroundColor = '#eff6ff'; // bg-blue-50
        inlineStyle.color = '#1d4ed8'; // text-blue-700
        inlineStyle.border = '1px solid #bfdbfe'; // border-blue-200
      } else if (color === 'green') {
        inlineStyle.backgroundColor = '#f0fdf4'; // bg-green-50
        inlineStyle.color = '#15803d'; // text-green-700
        inlineStyle.border = '1px solid #bbf7d0'; // border-green-200
      } else if (color === 'red') {
        inlineStyle.backgroundColor = '#fef2f2'; // bg-red-50
        inlineStyle.color = '#b91c1c'; // text-red-700
        inlineStyle.border = '1px solid #fecaca'; // border-red-200
      } else if (color === 'yellow') {
        inlineStyle.backgroundColor = '#fefce8'; // bg-yellow-50
        inlineStyle.color = '#a16207'; // text-yellow-700
        inlineStyle.border = '1px solid #fde047'; // border-yellow-200
      } else {
        inlineStyle.backgroundColor = '#f9fafb'; // bg-gray-50
        inlineStyle.color = '#374151'; // text-gray-700
        inlineStyle.border = '1px solid #e5e7eb'; // border-gray-200
      }
      inlineStyle.borderRadius = '0.5rem'; // rounded-lg
    } else if (variant === 'outline') {
      if (color === 'blue') {
        inlineStyle.backgroundColor = '#eff6ff'; // bg-blue-50
        inlineStyle.color = '#1d4ed8'; // text-blue-700
        inlineStyle.border = '1px solid #bfdbfe'; // border-blue-200
      } else if (color === 'green') {
        inlineStyle.backgroundColor = '#f0fdf4'; // bg-green-50
        inlineStyle.color = '#15803d'; // text-green-700
        inlineStyle.border = '1px solid #bbf7d0'; // border-green-200
      } else if (color === 'red') {
        inlineStyle.backgroundColor = '#fef2f2'; // bg-red-50
        inlineStyle.color = '#b91c1c'; // text-red-700
        inlineStyle.border = '1px solid #fecaca'; // border-red-200
      } else if (color === 'yellow') {
        inlineStyle.backgroundColor = '#fefce8'; // bg-yellow-50
        inlineStyle.color = '#a16207'; // text-yellow-700
        inlineStyle.border = '1px solid #fde047'; // border-yellow-200
      } else {
        inlineStyle.backgroundColor = '#f9fafb'; // bg-gray-50
        inlineStyle.color = '#374151'; // text-gray-700
        inlineStyle.border = '1px solid #e5e7eb'; // border-gray-200
      }
      inlineStyle.borderRadius = '0.5rem'; // rounded-lg
    } else if (variant === 'danger') {
      inlineStyle.backgroundColor = '#fef2f2'; // bg-red-50
      inlineStyle.color = '#b91c1c'; // text-red-700
      inlineStyle.border = '1px solid #fecaca'; // border-red-200
      inlineStyle.borderRadius = '0.5rem'; // rounded-lg
    }

    // Add padding based on size
    if (size === 'sm') {
      inlineStyle.padding = '0.375rem 0.75rem'; // py-1.5 px-3
    } else if (size === 'md') {
      inlineStyle.padding = '0.5rem 1rem'; // py-2 px-4
    } else if (size === 'lg') {
      inlineStyle.padding = '0.75rem 1.5rem'; // py-3 px-6
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        data-testid={testId}
        className={cn(
          'btn',
          colorClass,
          `btn-${size}`,
          isLoading && 'btn-loading',
          className
        )}
        style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
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

