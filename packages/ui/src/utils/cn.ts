import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conflicts and conditional classes
 *
 * @example
 * cn('btn', 'btn-primary')
 * cn('btn', variant === 'primary' && 'btn-primary')
 * cn('btn', { 'btn-primary': true, 'btn-disabled': false })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

