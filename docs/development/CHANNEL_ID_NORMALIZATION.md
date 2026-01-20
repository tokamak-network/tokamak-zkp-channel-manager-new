# Channel ID Normalization Guide

## Overview

Channel IDs in this application are Ethereum bytes32 values (e.g., `0x15C029113CD7DD38F4A9B716204645C4F54366E9424E60B9884CA474C906B477`). Due to case sensitivity in database keys, **all channel IDs must be normalized to lowercase** before database operations.

## The Problem

Ethereum addresses and bytes32 values can be represented in different cases:
- Uppercase: `0x15C029113CD7DD38F4A9B716204645C4F54366E9424E60B9884CA474C906B477`
- Lowercase: `0x15c029113cd7dd38f4a9b716204645c4f54366e9424e60b9884ca474c906b477`
- Mixed: `0x15C029113cd7DD38f4a9B716204645C4F54366E9424E60B9884CA474C906B477`

If data is stored with one case and retrieved with another, the lookup will fail with "not found" errors.

## Solution: Always Normalize to Lowercase

### In API Routes

**Always normalize channelId at the beginning of the handler:**

```typescript
// ✅ CORRECT
export async function POST(request: NextRequest) {
  const { channelId } = await request.json();
  
  // Normalize immediately after receiving
  const channelIdStr = String(channelId).toLowerCase();
  
  // Use channelIdStr for all DB operations
  const data = await getData(`channels.${channelIdStr}.someData`);
}

// ❌ WRONG - Don't use channelId directly
export async function POST(request: NextRequest) {
  const { channelId } = await request.json();
  
  // This may fail if channelId is uppercase
  const data = await getData(`channels.${channelId}.someData`);
}
```

### In Client-Side Code

**Normalize before making API calls:**

```typescript
// ✅ CORRECT
const response = await fetch('/api/some-endpoint', {
  method: 'POST',
  body: JSON.stringify({
    channelId: currentChannelId.toLowerCase(),
    // ... other fields
  }),
});

// ✅ ALSO CORRECT - Let API handle it, but be consistent
const response = await fetch(`/api/endpoint?channelId=${channelId}`);
// API should normalize internally
```

### In Database Paths

**All database paths should use normalized (lowercase) channel IDs:**

```typescript
// ✅ CORRECT
const dbPath = `channels.${channelIdStr.toLowerCase()}.submittedProofs.${proofId}`;

// ❌ WRONG
const dbPath = `channels.${channelId}.submittedProofs.${proofId}`;
```

## API Checklist

When creating or modifying API routes that use channelId:

- [ ] Normalize channelId to lowercase immediately after receiving it
- [ ] Use the normalized value for all database operations
- [ ] Use the normalized value for file system paths
- [ ] Document the normalization in code comments

## Affected APIs

The following APIs have been updated to normalize channelId:

| API | Status |
|-----|--------|
| `/api/get-proof-zip` | ✅ Normalized |
| `/api/delete-proof` | ✅ Normalized |
| `/api/get-next-proof-number` | ✅ Normalized |
| `/api/save-proof-zip` | ✅ Normalized |
| `/api/channels/[id]` | ✅ Uses `getChannel()` which normalizes |
| `/api/tokamak-zk-evm` | ✅ Normalized (synthesize, approve-proof) |
| `/api/db` | ⚠️ Caller should normalize |

## Utility Functions with Built-in Normalization

The following functions in `lib/db/channels.ts` already handle normalization internally:

```typescript
// ✅ These functions normalize channelId internally
getChannel(channelId)      // Normalizes to lowercase
getProofs(channelId, type) // Normalizes to lowercase
saveProof(channelId, ...)  // Normalizes to lowercase
deleteProof(channelId, ...)// Normalizes to lowercase
moveProof(channelId, ...)  // Normalizes to lowercase
updateChannel(channelId, ...)// Normalizes to lowercase
```

**When using these utility functions, you don't need to normalize manually.**

However, when using low-level `getData()`, `setData()`, or `deleteData()` directly, you MUST normalize manually.

## Standard Pattern

Use this pattern in all API routes:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, ...otherFields } = body;

    // Validate required fields
    if (!channelId) {
      return NextResponse.json(
        { error: "Missing required field: channelId" },
        { status: 400 }
      );
    }

    // ⚠️ IMPORTANT: Normalize channelId to lowercase
    const channelIdStr = String(channelId).toLowerCase();

    // Now use channelIdStr for all operations
    const data = await getData(`channels.${channelIdStr}.someData`);
    
    // ...rest of the handler
  } catch (error) {
    // error handling
  }
}
```

## Testing

When testing APIs manually or writing tests:

1. Test with uppercase channelId
2. Test with lowercase channelId
3. Test with mixed case channelId
4. All should produce the same result

## Related Issues

- Download proof failed: channelId case mismatch between storage and retrieval
- Delete proof "Channel not found": channelId case mismatch
- Proof list empty: stored lowercase, queried uppercase

## See Also

- [Transaction Hook Error Handling](./TRANSACTION_HOOK_ERROR_HANDLING.md)
