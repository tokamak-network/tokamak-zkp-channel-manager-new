# Navigation Pattern

## Rule: Always Use Next.js Router for Navigation

In this Next.js application, **all page navigation must use the Next.js router** (`useRouter` from `next/navigation`). Direct navigation methods like `window.location` or anchor tags should not be used.

## Implementation

### ✅ Correct: Using useRouter

```tsx
'use client';

import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  
  const handleNavigate = () => {
    router.push('/target-page');
  };
  
  return (
    <button onClick={handleNavigate}>
      Go to Page
    </button>
  );
}
```

### ❌ Incorrect: Direct Navigation

```tsx
// Don't use window.location
window.location.href = '/target-page';

// Don't use anchor tags for internal navigation
<a href="/target-page">Go to Page</a>
```

## When to Use Each Method

### useRouter.push()
- **Use for**: Programmatic navigation triggered by user actions
- **Example**: Button click, form submission, conditional navigation

```tsx
const router = useRouter();
router.push('/create-channel');
```

### useRouter.replace()
- **Use for**: Navigation that should replace current history entry
- **Example**: Redirects, login/logout flows

```tsx
const router = useRouter();
router.replace('/dashboard');
```

### Link Component
- **Use for**: Static navigation links in navigation menus
- **Example**: Sidebar links, header navigation

```tsx
import Link from 'next/link';

<Link href="/create-channel">
  Create Channel
</Link>
```

## Benefits

1. **Client-side navigation**: Faster page transitions without full page reload
2. **State preservation**: React state is maintained during navigation
3. **Prefetching**: Next.js automatically prefetches linked pages
4. **Consistent behavior**: All navigation follows the same pattern

## Migration Guide

If you find code using direct navigation:

1. Import `useRouter` from `next/navigation`
2. Replace `window.location.href = '/path'` with `router.push('/path')`
3. Replace anchor tags with `Link` component for static links
4. Use `router.replace()` for redirects

## Examples in Codebase

- **Sidebar.tsx**: Uses `Link` component for navigation menu
- **All page components**: Use `useRouter` for programmatic navigation
