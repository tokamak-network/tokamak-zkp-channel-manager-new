# Slot Index Removal

## Overview

The `slotIndex` parameter has been removed from the user interface and is now fixed to `0` in all L2 address and MPT key generation logic. This document explains the rationale and implementation details.

## Rationale

The slot index was previously used to differentiate between different tokens or accounts within the same channel. However, in the current implementation:

1. **Single Token Per Channel**: Each channel supports only one target contract (token), making slot index differentiation unnecessary.
2. **Simplified User Experience**: Removing the slot index input reduces UI complexity and potential user errors.
3. **Consistent Behavior**: All L2 address and MPT key generation now uses a fixed slot index of `0`, ensuring consistent results across the application.

## Implementation Details

### Fixed Value

The slot index is now hardcoded to `0` in all relevant functions:

```typescript
// Fixed slot index value
const slotIndex = 0;

// Used in L2 key derivation
const accountL2 = deriveL2KeysAndAddressFromSignature(signature, slotIndex);
```

### Affected Components

1. **`app/l2-address/page.tsx`**
   - Removed slot index input field from UI
   - Slot index is fixed to `0` internally
   - Removed slot index display from result section

2. **`app/create-channel/_hooks/useGenerateMptKey.ts`**
   - Slot index is fixed to `0` in the `generateMPTKey` function
   - Comment indicates: `// Slot index fixed to 0`

3. **`app/create-channel/_components/Step2Deposit.tsx`**
   - Slot index input field was previously removed
   - MPT key generation uses fixed slot index of `0`

### Function Signatures

The underlying functions in `lib/tokamakl2js.ts` still accept `slotIndex` as a parameter for flexibility, but all call sites now pass `0`:

```typescript
// Function signature (unchanged)
export const deriveL2KeysAndAddressFromSignature = (
  signature: `0x${string}`,
  slotIndex: number  // Always 0 in practice
): DerivedL2Account => {
  // ...
};

// Usage (always 0)
const accountL2 = deriveL2KeysAndAddressFromSignature(signature, 0);
```

## Migration Notes

### For Developers

When working with L2 address or MPT key generation:

1. **Do NOT** add slot index input fields to new UI components
2. **Always** use `0` as the slot index value when calling derivation functions
3. **Do NOT** expose slot index configuration to end users

### For Future Changes

If slot index functionality needs to be reintroduced in the future:

1. Review the business requirements carefully
2. Ensure the use case justifies the added UI complexity
3. Update this document to reflect the change
4. Consider backward compatibility with existing generated keys

## Testing

All existing tests and functionality should continue to work as before, since slot index was already effectively fixed to `0` in most use cases. The change is primarily a UI simplification.

## Related Files

- `app/l2-address/page.tsx` - L2 address lookup page (UI removed)
- `app/create-channel/_hooks/useGenerateMptKey.ts` - MPT key generation hook (fixed to 0)
- `app/create-channel/_components/Step2Deposit.tsx` - Deposit page (previously removed)
- `lib/tokamakl2js.ts` - Core L2 key derivation functions (parameter still exists for flexibility)

## Date

This change was implemented on: 2024-12-19

---

**Note**: This document should be updated if slot index functionality is reintroduced or if the underlying implementation changes.
