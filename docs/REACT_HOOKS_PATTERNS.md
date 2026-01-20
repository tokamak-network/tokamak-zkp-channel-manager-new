# React Hooks Patterns

This document defines coding patterns and best practices for using React hooks in this project.

## Overview

Following consistent patterns for React hooks ensures:
- Better code readability and maintainability
- Easier debugging and testing
- Proper dependency management
- Avoidance of common React pitfalls

---

## Rule: No Function Declarations Inside useEffect

### ❌ Bad: Function declared inside useEffect

```typescript
useEffect(() => {
  const handleSomething = async () => {
    // ... logic
  };
  
  handleSomething();
}, [deps]);
```

**Problems:**
- Function is recreated on every effect run
- Harder to test in isolation
- Difficult to reuse
- Can cause unnecessary re-renders

### ✅ Good: Use useCallback or regular function

**Option 1: useCallback (recommended for functions with dependencies)**

```typescript
const handleSomething = useCallback(async () => {
  // ... logic
}, [dependencies]);

useEffect(() => {
  handleSomething();
}, [handleSomething]);
```

**Option 2: Regular function (for simple cases without dependencies)**

```typescript
const handleSomething = async () => {
  // ... logic
};

useEffect(() => {
  handleSomething();
}, [deps]);
```

### When to Use Each Approach

**Use `useCallback` when:**
- The function depends on props, state, or other hooks
- The function is passed as a prop to child components
- You want to memoize the function to prevent unnecessary re-renders
- The function is used in multiple places

**Use regular function when:**
- The function has no dependencies
- The function is only used within the component
- The function doesn't need to be memoized

---

## Examples

### Example 1: Async Operation in useEffect

**❌ Bad:**
```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  };
  
  fetchData();
}, []);
```

**✅ Good:**
```typescript
const fetchData = useCallback(async () => {
  const response = await fetch('/api/data');
  const data = await response.json();
  setData(data);
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Example 2: Event Handler with Dependencies

**❌ Bad:**
```typescript
useEffect(() => {
  const handleClick = () => {
    console.log('Clicked:', userId);
    doSomething(userId);
  };
  
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}, [userId]);
```

**✅ Good:**
```typescript
const handleClick = useCallback(() => {
  console.log('Clicked:', userId);
  doSomething(userId);
}, [userId]);

useEffect(() => {
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}, [handleClick, element]);
```

### Example 3: Complex Logic with Multiple Dependencies

**❌ Bad:**
```typescript
useEffect(() => {
  const processTransaction = async () => {
    if (!receipt || !isSuccess) return;
    
    try {
      const channelId = extractChannelId(receipt);
      await saveToDatabase(channelId, receipt, participants);
      onSuccess(channelId);
    } catch (error) {
      handleError(error);
    }
  };
  
  processTransaction();
}, [receipt, isSuccess, participants]);
```

**✅ Good:**
```typescript
const processTransaction = useCallback(async () => {
  if (!receipt || !isSuccess) return;
  
  try {
    const channelId = extractChannelId(receipt);
    await saveToDatabase(channelId, receipt, participants);
    onSuccess(channelId);
  } catch (error) {
    handleError(error);
  }
}, [receipt, isSuccess, participants, onSuccess, handleError]);

useEffect(() => {
  processTransaction();
}, [processTransaction]);
```

---

## Additional Best Practices

### 1. Dependency Arrays

Always include all dependencies used in the effect:

```typescript
// ✅ Good
useEffect(() => {
  doSomething(value1, value2);
}, [value1, value2]);

// ❌ Bad - missing dependencies
useEffect(() => {
  doSomething(value1, value2);
}, [value1]); // value2 is missing!
```

### 2. Cleanup Functions

Always return cleanup functions for subscriptions, timers, etc.:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // ... logic
  }, 1000);
  
  return () => clearTimeout(timer);
}, [deps]);
```

### 3. Conditional Effects

Check conditions at the start of the effect or useCallback:

```typescript
// ✅ Good
const handleSomething = useCallback(() => {
  if (!condition) return;
  // ... logic
}, [condition]);

// ❌ Bad - condition check inside useEffect
useEffect(() => {
  if (condition) {
    // ... logic
  }
}, [deps]);
```

### 4. Multiple Effects vs Single Effect

Prefer multiple focused effects over one large effect:

```typescript
// ✅ Good - separate concerns
useEffect(() => {
  // Handle subscription
}, [subscription]);

useEffect(() => {
  // Handle data fetching
}, [dataId]);

// ❌ Bad - mixing concerns
useEffect(() => {
  // Handle subscription
  // Handle data fetching
  // Handle something else
}, [subscription, dataId, something]);
```

---

## Testing Considerations

Functions defined with `useCallback` or as regular functions are easier to test:

```typescript
// ✅ Easy to test
const handleSubmit = useCallback(async (data) => {
  await submitData(data);
}, []);

// Can be tested directly
test('handleSubmit calls submitData', async () => {
  const submitData = jest.fn();
  // ... test implementation
});
```

---

## Migration Guide

When refactoring existing code:

1. **Identify functions inside useEffect**
   ```typescript
   useEffect(() => {
     const fn = () => { /* ... */ };
     fn();
   }, [deps]);
   ```

2. **Move function outside useEffect**
   ```typescript
   const fn = useCallback(() => {
     /* ... */
   }, [deps]);
   
   useEffect(() => {
     fn();
   }, [fn]);
   ```

3. **Update dependencies**
   - Include all dependencies used in the function
   - Include the function itself in useEffect dependencies

4. **Test the refactored code**
   - Ensure behavior is unchanged
   - Verify no unnecessary re-renders

---

---

## Rule: Hook Placement for Single-Use Values

### Principle

When a hook value is only used in one specific location, place the hook call immediately above where it's used to improve readability and maintainability.

### ❌ Bad: Hook called far from usage

```typescript
const abi = useBridgeCoreAbi(); // Called at top of component

// ... many lines of code ...

const handleChannelCreated = useCallback(async () => {
  // ... logic ...
  const decoded = decodeEventLog({
    abi: abi, // Used here, but hook was called far above
    data: log.data,
    topics: log.topics,
  });
}, [abi, /* other deps */]);
```

**Problems:**
- Hard to see the relationship between hook call and usage
- Reduces code readability
- Makes it harder to understand what the hook is for
- Can lead to confusion when refactoring

### ✅ Good: Hook called immediately above usage

```typescript
// ... other code ...

// Handle transaction success - extract channel ID and save to database
// Get ABI only when needed for decoding (used in handleChannelCreated)
const abi = useBridgeCoreAbi();

const handleChannelCreated = useCallback(async () => {
  // ... logic ...
  const decoded = decodeEventLog({
    abi: abi, // Used here, hook called right above
    data: log.data,
    topics: log.topics,
  });
}, [abi, /* other deps */]);
```

**Benefits:**
- Clear relationship between hook and usage
- Better code readability
- Easier to understand the purpose
- Simplifies refactoring

### When to Apply This Rule

**Apply when:**
- The hook value is used in only one specific location
- The hook call is far from its usage (more than ~10-20 lines)
- Moving it closer improves code clarity

**Don't apply when:**
- The hook value is used in multiple places
- The hook is a core dependency used throughout the component
- Moving it would make the code less readable
- The hook is part of a logical grouping of related hooks at the top

### Examples

#### Example 1: ABI for Event Decoding

**❌ Bad:**
```typescript
export function Step1CreateChannel() {
  const abi = useBridgeCoreAbi(); // Called at top
  
  // ... 50+ lines of other code ...
  
  const handleChannelCreated = useCallback(async () => {
    const decoded = decodeEventLog({
      abi: abi, // Only used here
      data: log.data,
      topics: log.topics,
    });
  }, [abi]);
}
```

**✅ Good:**
```typescript
export function Step1CreateChannel() {
  // ... other code ...
  
  // Get ABI only when needed for decoding
  const abi = useBridgeCoreAbi();
  
  const handleChannelCreated = useCallback(async () => {
    const decoded = decodeEventLog({
      abi: abi,
      data: log.data,
      topics: log.topics,
    });
  }, [abi]);
}
```

#### Example 2: Multiple Single-Use Hooks

**❌ Bad:**
```typescript
export function MyComponent() {
  const contractAddress = useContractAddress(); // Used only in handleSubmit
  const contractAbi = useContractAbi(); // Used only in handleSubmit
  
  // ... many lines ...
  
  const handleSubmit = useCallback(async () => {
    await writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "submit",
    });
  }, [contractAddress, contractAbi]);
}
```

**✅ Good:**
```typescript
export function MyComponent() {
  // ... other code ...
  
  // Contract hooks for submit function
  const contractAddress = useContractAddress();
  const contractAbi = useContractAbi();
  
  const handleSubmit = useCallback(async () => {
    await writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "submit",
    });
  }, [contractAddress, contractAbi]);
}
```

### Exception: Core Component Dependencies

Some hooks are core dependencies used throughout the component. These should remain at the top:

```typescript
// ✅ Good - core dependencies at top
export function MyComponent() {
  const { address, isConnected } = useAccount(); // Used throughout
  const { data, isLoading } = useQuery(); // Used throughout
  
  // Single-use hook can be placed near usage
  const abi = useBridgeCoreAbi(); // Only used in one callback
  
  const handleSomething = useCallback(() => {
    // Uses abi here
  }, [abi]);
}
```

---

## Summary

- ✅ **Always** define functions outside `useEffect`
- ✅ **Use `useCallback`** for functions with dependencies
- ✅ **Use regular functions** for simple cases without dependencies
- ✅ **Include all dependencies** in dependency arrays
- ✅ **Place single-use hooks** immediately above their usage
- ✅ **Test functions** in isolation when possible

---

**Last Updated**: 2026-01-08
