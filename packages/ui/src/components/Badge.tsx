import { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge color variant */
  variant?: BadgeVariant;
}

/**
 * Badge component for status indicators
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 */
export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {children}
    </span>
  );
}

