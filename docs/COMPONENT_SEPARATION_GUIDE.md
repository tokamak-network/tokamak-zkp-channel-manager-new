# Component Separation Guide

## Overview

This guide provides best practices for separating complex logic from React components to improve code maintainability, readability, and testability. When components become too long or contain complex business logic, it's essential to extract that logic into custom hooks (`_hooks`) or utility functions (`_utils`).

## Principles

### When to Separate Logic

1. **Component Length**: If a component exceeds ~300-400 lines, consider extracting logic
2. **Complex State Management**: Multiple related state variables should be grouped in hooks
3. **Business Logic**: Any non-UI logic should be extracted
4. **Reusability**: Logic that might be reused elsewhere should be extracted
5. **Testability**: Complex logic is easier to test when separated

### Separation Patterns

#### 1. Custom Hooks (`_hooks/`)

Use custom hooks for:
- **Data Fetching**: API calls, data fetching logic
- **State Management**: Complex state with multiple related variables
- **Event Handlers**: Complex handler functions with business logic
- **Side Effects**: useEffect logic that manages component lifecycle
- **Business Logic**: Domain-specific operations

#### 2. Utility Functions (`_utils/`)

Use utility functions for:
- **Pure Functions**: Functions without side effects
- **Formatting**: Date formatting, number formatting, etc.
- **Transformations**: Data transformation functions
- **Validations**: Input validation logic
- **Calculations**: Mathematical operations, data calculations

**Important**: `_utils/` should contain **only pure functions** that return primitive values (string, number, boolean, objects, arrays). Functions that return React components (JSX) should be in `_components/`.

#### 3. React Components (`_components/`)

Use `_components/` for:
- **UI Components**: Any function that returns JSX/React elements
- **Status Badges**: Components that render status indicators
- **Icon Mappings**: Components that return icons or visual elements
- **Reusable UI Elements**: Small, reusable UI components

**File Naming**: Components should use `.tsx` extension and follow PascalCase naming (e.g., `ProofStatusBadge.tsx`).

**Key Rule**: If a function returns JSX (React elements), it belongs in `_components/`, not `_utils/`.

## Directory Structure

```
app/
  state-explorer/
    transaction/
      _components/          # React components (UI only, returns JSX)
        ProofList.tsx
        ProofStatusBadge.tsx
      _hooks/               # Custom hooks (state & logic)
        useProofs.ts
        useProofActions.ts
        index.ts
      _utils/               # Utility functions (pure functions, no JSX)
        proofUtils.ts       # formatDate() - returns string
      page.tsx
```

## Examples

### Example 1: Data Fetching Hook

**Before** (Component with fetching logic):
```typescript
export function ProofList() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProofs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/proofs`);
      const data = await response.json();
      setProofs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, [channelId]);

  // ... rest of component
}
```

**After** (Extracted to hook):
```typescript
// _hooks/useProofs.ts
export function useProofs({ channelId }: UseProofsParams) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProofs = useCallback(async () => {
    // ... fetching logic
  }, [channelId]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  return { proofs, isLoading, error, refetch: fetchProofs };
}

// Component
export function ProofList() {
  const { proofs, isLoading, error, refetch } = useProofs({
    channelId: currentChannelId,
  });
  // ... rest of component
}
```

### Example 2: Action Handlers Hook

**Before** (Component with handlers):
```typescript
export function ProofList() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [deletingProofKey, setDeletingProofKey] = useState<string | null>(null);

  const handleApproveSelected = async () => {
    setIsVerifying(true);
    try {
      // ... complex approval logic
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeletingProofKey(proof.key);
    try {
      // ... complex delete logic
    } finally {
      setDeletingProofKey(null);
    }
  };

  // ... many more handlers
}
```

**After** (Extracted to hook):
```typescript
// _hooks/useProofActions.ts
export function useProofActions({
  channelId,
  proofs,
  isLeader,
  onRefresh,
}: UseProofActionsParams) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [deletingProofKey, setDeletingProofKey] = useState<string | null>(null);

  const handleApproveSelected = useCallback(async () => {
    // ... approval logic
  }, [/* dependencies */]);

  const handleDeleteConfirm = useCallback(async () => {
    // ... delete logic
  }, [/* dependencies */]);

  return {
    handleApproveSelected,
    handleDeleteConfirm,
    isVerifying,
    deletingProofKey,
    // ... other handlers and state
  };
}

// Component
export function ProofList() {
  const {
    handleApproveSelected,
    handleDeleteConfirm,
    isVerifying,
    deletingProofKey,
  } = useProofActions({
    channelId: currentChannelId,
    proofs,
    isLeader,
    onRefresh: fetchProofs,
  });
  // ... rest of component
}
```

### Example 3: Utility Functions vs Components

**Before** (Component with mixed functions):
```typescript
export function ProofList() {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <span>Approved</span>; // Returns JSX!
      // ... more cases
    }
  };

  // ... rest of component
}
```

**After** (Properly separated):
```typescript
// _utils/proofUtils.ts - Pure function, returns string
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// _components/ProofStatusBadge.tsx - Component, returns JSX
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface ProofStatusBadgeProps {
  status: "verified" | "pending" | "rejected";
}

export function ProofStatusBadge({ status }: ProofStatusBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    // ... more cases
  }
}

// Component
import { formatDate } from "../_utils/proofUtils";
import { ProofStatusBadge } from "./ProofStatusBadge";

export function ProofList() {
  return (
    <div>
      <div>{formatDate(proof.submittedAt)}</div>
      <ProofStatusBadge status={proof.status} />
    </div>
  );
}
```

**Key Distinction**:
- `formatDate()` returns a **string** → `_utils/`
- `ProofStatusBadge()` returns **JSX** → `_components/`

## Hook Design Patterns

### 1. Single Responsibility

Each hook should have a single, clear responsibility:

```typescript
// ✅ Good: Single responsibility
export function useProofs({ channelId }: UseProofsParams) {
  // Only handles fetching proofs
}

export function useProofActions({ channelId, proofs }: UseProofActionsParams) {
  // Only handles proof actions (approve, delete, etc.)
}

// ❌ Bad: Multiple responsibilities
export function useProofsAndActions({ channelId }: Params) {
  // Fetches proofs AND handles actions - too much!
}
```

### 2. Clear Interface

Hooks should have clear input parameters and return values:

```typescript
interface UseProofActionsParams {
  channelId: string | null;
  proofs: Proof[];
  isLeader: boolean;
  onRefresh: () => Promise<void>;
}

interface UseProofActionsReturn {
  handleApproveSelected: () => Promise<void>;
  handleDeleteConfirm: () => Promise<void>;
  isVerifying: boolean;
  deletingProofKey: string | null;
  // ... other return values
}

export function useProofActions(
  params: UseProofActionsParams
): UseProofActionsReturn {
  // ... implementation
}
```

### 3. Memoization

Use `useCallback` for handler functions to prevent unnecessary re-renders:

```typescript
const handleApproveSelected = useCallback(async () => {
  // ... logic
}, [selectedProofForApproval, isLeader, address, proofs, channelId, onRefresh]);
```

### 4. State Grouping

Group related state variables together:

```typescript
// ✅ Good: Related state grouped
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [proofToDelete, setProofToDelete] = useState<Proof | null>(null);
const [deletingProofKey, setDeletingProofKey] = useState<string | null>(null);

// ❌ Bad: Unrelated state mixed
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [userName, setUserName] = useState("");
const [proofToDelete, setProofToDelete] = useState<Proof | null>(null);
```

## Component Structure After Separation

After extracting logic, components should be focused on:

1. **Rendering UI**: JSX structure and layout
2. **Composing Hooks**: Calling hooks and using their return values
3. **Event Binding**: Connecting UI events to hook handlers
4. **Conditional Rendering**: Based on hook state

```typescript
export function ProofList() {
  // 1. Get data
  const { proofs, isLoading, error, refetch } = useProofs({
    channelId: currentChannelId,
  });

  // 2. Get actions
  const {
    handleApproveSelected,
    handleDeleteConfirm,
    isVerifying,
  } = useProofActions({
    channelId: currentChannelId,
    proofs,
    isLeader,
    onRefresh: refetch,
  });

  // 3. Render UI
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      {/* UI structure */}
      <Button onClick={handleApproveSelected}>Approve</Button>
      {/* ... more UI */}
    </div>
  );
}
```

## File Organization

### Hook Files

- **Naming**: Use `use` prefix (e.g., `useProofs.ts`, `useProofActions.ts`)
- **Location**: Place in `_hooks/` directory within the feature folder
- **Exports**: Export from `_hooks/index.ts` for clean imports

```typescript
// _hooks/index.ts
export { useProofs } from "./useProofs";
export { useProofActions } from "./useProofActions";
export type { Proof } from "./useProofs";

// Component
import { useProofs, useProofActions } from "../_hooks";
```

### Utility Files (`_utils/`)

- **Naming**: Use descriptive names (e.g., `proofUtils.ts`, `dateUtils.ts`)
- **Location**: Place in `_utils/` directory within the feature folder
- **Extension**: Use `.ts` (not `.tsx`) - utilities should not contain JSX
- **Exports**: Export individual functions, not default exports
- **Rule**: Functions must return primitive values (string, number, boolean, objects, arrays) - **NO JSX**

```typescript
// _utils/proofUtils.ts - Pure function, returns string
export function formatDate(dateString: string): string {
  // ... implementation
  return formattedString;
}

// Component
import { formatDate } from "../_utils/proofUtils";
```

### Component Files (`_components/`)

- **Naming**: Use PascalCase (e.g., `ProofStatusBadge.tsx`, `StatusIndicator.tsx`)
- **Location**: Place in `_components/` directory within the feature folder
- **Extension**: Use `.tsx` - components return JSX
- **Rule**: Any function that returns JSX/React elements belongs here

```typescript
// _components/ProofStatusBadge.tsx - Component, returns JSX
import { CheckCircle } from "lucide-react";

interface ProofStatusBadgeProps {
  status: "verified" | "pending" | "rejected";
}

export function ProofStatusBadge({ status }: ProofStatusBadgeProps) {
  return <span>...</span>; // Returns JSX
}

// Component
import { ProofStatusBadge } from "./ProofStatusBadge";
```

**Decision Tree**:
- Does the function return JSX? → `_components/` (`.tsx`)
- Does the function return a primitive value? → `_utils/` (`.ts`)

## Benefits

### 1. Improved Readability

- Components become shorter and easier to understand
- Logic is organized by concern
- Clear separation between UI and business logic

### 2. Better Testability

- Hooks can be tested independently
- Utility functions are easy to unit test
- Components can be tested with mocked hooks

### 3. Reusability

- Hooks can be reused across multiple components
- Utility functions can be shared
- Logic is not tied to specific UI

### 4. Maintainability

- Changes to business logic don't affect component structure
- Easier to locate and fix bugs
- Clearer code organization

## Migration Checklist

When refactoring a component:

- [ ] Identify complex logic (handlers, data fetching, state management)
- [ ] Extract data fetching to `use[Feature]Data` hook
- [ ] Extract action handlers to `use[Feature]Actions` hook
- [ ] Extract pure utility functions to `_utils/[feature]Utils.ts` (returns primitives)
- [ ] Extract components that return JSX to `_components/[ComponentName].tsx`
- [ ] Update component to use hooks and utilities
- [ ] Remove unused imports and state
- [ ] Test the refactored component
- [ ] Update related tests

## Common Patterns

### Pattern 1: Data + Actions Separation

```typescript
// Data hook
const { data, isLoading, error, refetch } = useProofs({ channelId });

// Actions hook
const { handleApprove, handleDelete, isProcessing } = useProofActions({
  channelId,
  data,
  onRefresh: refetch,
});
```

### Pattern 2: Related State Grouping

```typescript
// Group related state in a single hook
const {
  selectedItem,
  setSelectedItem,
  isProcessing,
  handleAction,
} = useItemActions({ items, onAction });
```

### Pattern 3: Utility Composition

```typescript
// Compose utilities for complex operations
import { formatDate } from "../_utils/dateUtils";
import { formatCurrency } from "../_utils/currencyUtils";

const formattedData = {
  date: formatDate(item.date),
  amount: formatCurrency(item.amount),
};
```

## Anti-patterns to Avoid

### ❌ Don't: Mix Concerns

```typescript
// Bad: Hook does too much
export function useProofsAndActions() {
  // Fetches data AND handles actions
  // Too many responsibilities!
}
```

### ❌ Don't: Keep Logic in Components

```typescript
// Bad: Complex logic in component
export function ProofList() {
  const handleComplexOperation = async () => {
    // 100+ lines of business logic
    // Should be in a hook!
  };
}
```

### ❌ Don't: Duplicate Logic

```typescript
// Bad: Same logic in multiple components
// Component A
const formatDate = (date) => { /* ... */ };

// Component B
const formatDate = (date) => { /* ... */ }; // Duplicate!

// Good: Shared utility
import { formatDate } from "../_utils/dateUtils";
```

### ❌ Don't: Put JSX-Returning Functions in `_utils/`

```typescript
// ❌ Bad: Function returns JSX but is in _utils/
// _utils/proofUtils.tsx
export function getStatusBadge(status: string) {
  return <span>Approved</span>; // Returns JSX - wrong location!
}

// ✅ Good: Component in _components/
// _components/ProofStatusBadge.tsx
export function ProofStatusBadge({ status }: Props) {
  return <span>Approved</span>; // Returns JSX - correct location!
}

// ✅ Good: Pure function in _utils/
// _utils/proofUtils.ts
export function formatDate(dateString: string): string {
  return formattedString; // Returns string - correct location!
}
```

**Rule of Thumb**: 
- If it returns JSX → `_components/` (`.tsx`)
- If it returns a primitive → `_utils/` (`.ts`)

## References

- [React Hooks Documentation](https://react.dev/reference/react)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- Project-specific patterns in `docs/MIGRATION_PATTERNS.md`

## Summary

**Key Takeaways:**

1. **Extract when components exceed ~300-400 lines**
2. **Use `_hooks/` for state management and business logic**
3. **Use `_utils/` for pure functions that return primitives (string, number, boolean, objects, arrays)**
4. **Use `_components/` for functions that return JSX/React elements**
5. **Keep components focused on UI rendering**
6. **Group related state and handlers together**
7. **Use clear interfaces and single responsibility**

**Critical Rule**: 
- **Returns JSX?** → `_components/` (`.tsx` file, PascalCase naming)
- **Returns primitive?** → `_utils/` (`.ts` file, camelCase naming)

Following these patterns will result in more maintainable, testable, and readable code.
