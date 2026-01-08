import { ButtonHTMLAttributes, forwardRef } from 'react';

/**
 * Button - 공통 버튼 컴포넌트
 * 
 * TODO: 디자인 적용 시
 * - variant별 스타일
 * - size별 스타일  
 * - 로딩 상태
 * - 아이콘 지원
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-[var(--muted)] hover:bg-[var(--border)]',
  outline: 'border border-[var(--border)] hover:bg-[var(--muted)]',
  ghost: 'hover:bg-[var(--muted)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center rounded-lg font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

