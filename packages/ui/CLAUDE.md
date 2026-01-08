# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

This is the **UI package** for the Tokamak ZKP Channel Manager - a component library built with **Tailwind CSS** that provides reusable UI components for the web application.

### Key Principles

- Components must be reusable and composable
- No business logic - only presentation and interaction
- Use `@apply` directive for custom CSS classes to improve readability
- Follow consistent naming conventions
- Only export what's needed from `ui/src`

## Directory Structure

```
packages/ui/
├── src/
│   ├── components/       # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── styles/           # CSS files
│   │   ├── globals.css   # @tailwind directives + @layer components
│   │   ├── components.css
│   │   └── utilities.css
│   ├── hooks/            # UI-related hooks
│   │   └── useTheme.ts
│   ├── icons/            # Icon components
│   │   └── index.ts
│   ├── utils/            # UI utilities
│   │   └── cn.ts         # Class name merger
│   └── index.ts          # Public exports
├── tailwind.config.js
├── package.json
└── CLAUDE.md
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format
```

## Component Development

### Creating a New Component

1. Create component file in `src/components/`
2. Use custom CSS classes with `@apply` for styling
3. Use `cn()` utility for conditional classes
4. Export from `src/index.ts`

### Example Component

```tsx
// src/components/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => {
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
        {isLoading ? <LoadingSpinner /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

## Styling Guidelines

### Custom CSS Classes with @apply

Define reusable classes in `styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Base button */
  .btn {
    @apply inline-flex items-center justify-center rounded-lg font-medium;
    @apply transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
    @apply disabled:cursor-not-allowed disabled:opacity-50;
  }

  /* Button variants */
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }

  .btn-secondary {
    @apply bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500;
  }

  .btn-outline {
    @apply border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-gray-100 focus:ring-gray-500;
  }

  /* Button sizes */
  .btn-sm { @apply px-3 py-1.5 text-sm; }
  .btn-md { @apply px-4 py-2 text-base; }
  .btn-lg { @apply px-6 py-3 text-lg; }

  /* Loading state */
  .btn-loading {
    @apply cursor-wait;
  }
}
```

### Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `.{component}` | `.btn`, `.card`, `.input` | Base component |
| `.{component}-{variant}` | `.btn-primary`, `.card-bordered` | Variant |
| `.{component}-{size}` | `.btn-sm`, `.input-lg` | Size modifier |
| `.{component}-{state}` | `.btn-loading`, `.input-error` | State |
| `.{component}-{part}` | `.card-header`, `.card-footer` | Sub-element |

### Using cn() Utility

```tsx
import { cn } from '../utils/cn';

// Basic usage
<div className={cn('btn', 'btn-primary')} />

// Conditional classes
<div className={cn(
  'btn',
  variant === 'primary' && 'btn-primary',
  variant === 'secondary' && 'btn-secondary',
  isDisabled && 'opacity-50',
  className
)} />

// With objects
<div className={cn('btn', {
  'btn-primary': variant === 'primary',
  'btn-secondary': variant === 'secondary',
  'cursor-not-allowed': isDisabled,
})} />
```

### cn() Implementation

```ts
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Theme System

### CSS Variables

Define theme variables in `globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  --ring: #0ea5e9;
  
  --primary-50: #f0f9ff;
  --primary-500: #0ea5e9;
  --primary-600: #0284c7;
  --primary-700: #0369a1;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --border: #262626;
}
```

### Using Theme Variables

```tsx
// In Tailwind classes
<div className="bg-[var(--background)] text-[var(--foreground)]" />

// Or extend tailwind.config.js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
      },
    },
  },
}
```

## Icons

### Using Lucide Icons

```tsx
import { AlertTriangle, Check, X } from 'lucide-react';

// Basic usage
<AlertTriangle className="h-5 w-5 text-red-500" />

// With custom class
<Check className="icon-sm text-green-500" />
```

### Icon Size Classes

```css
@layer components {
  .icon-xs { @apply h-3 w-3; }
  .icon-sm { @apply h-4 w-4; }
  .icon-md { @apply h-5 w-5; }
  .icon-lg { @apply h-6 w-6; }
  .icon-xl { @apply h-8 w-8; }
}
```

## Core Components

### Button

```tsx
import { Button } from '@tokamak/ui';

<Button variant="primary" size="md">
  Click me
</Button>

<Button variant="outline" isLoading>
  Loading...
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@tokamak/ui';

<Card>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

```tsx
import { Input } from '@tokamak/ui';

<Input
  label="Email"
  placeholder="Enter email"
  error="Invalid email format"
/>
```

## Component Patterns

### Compound Components

```tsx
// Card with compound pattern
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

### Forwarding Refs

```tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return <input ref={ref} {...props} />;
  }
);
```

### Polymorphic Components

```tsx
interface BoxProps<T extends React.ElementType = 'div'> {
  as?: T;
  children?: React.ReactNode;
}

export function Box<T extends React.ElementType = 'div'>({
  as,
  children,
  ...props
}: BoxProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof BoxProps<T>>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}
```

## Testing

### Component Testing Pattern

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Do's and Don'ts

### ✅ Do's

- Use `@apply` for reusable class combinations
- Use `cn()` for conditional class merging
- Follow naming conventions consistently
- Keep components focused and single-purpose
- Use TypeScript strictly with proper interfaces
- Forward refs for form elements
- Export all public components from `index.ts`
- Document props with JSDoc comments

### ❌ Don'ts

- Don't add business logic to UI components
- Don't use inline styles (use Tailwind classes)
- Don't hardcode colors (use CSS variables or Tailwind config)
- Don't create components with too many responsibilities
- Don't use arbitrary values (`text-[17px]`) - extend config instead
- Don't forget to handle disabled and loading states
- Don't skip accessibility attributes (aria-*, role, etc.)

## Accessibility Checklist

- [ ] Proper semantic HTML elements
- [ ] `aria-label` for icon-only buttons
- [ ] `aria-describedby` for error messages
- [ ] Keyboard navigation support
- [ ] Focus visible states
- [ ] Color contrast ratios
- [ ] Screen reader testing

## Dependencies

```json
{
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

## Integration with App

When using UI components in the app:

```tsx
// Import from package
import { Button, Card, Input } from '@tokamak/ui';

// Import styles in root layout
import '@tokamak/ui/styles/globals.css';
```

