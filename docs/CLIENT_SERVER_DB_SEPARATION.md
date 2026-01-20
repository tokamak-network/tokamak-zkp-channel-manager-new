# Client-Server Database Separation

## Overview

This project separates database access into two distinct modules:
- **Server-side**: `@/lib/db` - Direct file system access (uses `fs`, `lowdb/node`)
- **Client-side**: `@/lib/db-client` - API-based access (uses `/api/db` endpoint)

## Important Rules

### ❌ DO NOT Import Server-Side DB in Client Components

**Never** import from `@/lib/db` in client components (files with `"use client"`):

```typescript
// ❌ WRONG - This will cause build errors
"use client";
import { getChannel } from "@/lib/db"; // Error: Can't resolve 'fs'
```

### ✅ Use Client-Side DB Helpers

**Always** use `@/lib/db-client` in client components:

```typescript
// ✅ CORRECT - Use client-side helpers
"use client";
import { getChannel } from "@/lib/db-client"; // Works in browser
```

## Module Locations

### Server-Side (`@/lib/db`)
- **Location**: `lib/db/`
- **Files**: `client.ts`, `helpers.ts`, `channels.ts`, `index.ts`
- **Usage**: Next.js API routes, server components, server actions
- **Features**: Direct file system access, uses `fs` module, `lowdb/node`

### Client-Side (`@/lib/db-client`)
- **Location**: `lib/db-client.ts`
- **Usage**: Client components, browser code
- **Features**: HTTP API calls to `/api/db`, no file system access

## API Endpoint

The client-side helpers use the `/api/db` endpoint:

- **GET** `/api/db?path=channels.123` - Read data
- **POST** `/api/db` - Write data (set/update/push)
- **DELETE** `/api/db?path=channels.123` - Delete data

## Path Notation

Both server-side and client-side use **dot notation** for paths:

```typescript
// Examples
"channels.123"                    // Channel 123
"channels.123.participants"       // Participants of channel 123
"channels.123.stateSnapshots"     // State snapshots
"channels.123.verifiedProofs"    // Verified proofs
```

## Available Functions

### Client-Side (`@/lib/db-client`)

All functions return Promises and use fetch API:

- `getData<T>(path: string)` - Get data from path
- `setData(path: string, data: any)` - Set data (replace)
- `updateData(path: string, data: any)` - Update data (merge)
- `pushData(path: string, data: any)` - Push data (auto-key)
- `deleteData(path: string)` - Delete data
- `getChannel(channelId: string)` - Get channel by ID
- `getChannelParticipants(channelId: string)` - Get participants
- `getLatestSnapshot(channelId: string)` - Get latest snapshot
- `getChannelUserBalances(channelId: string)` - Get user balances
- `getCurrentStateNumber(channelId: string)` - Get current state number

### Server-Side (`@/lib/db`)

Same function names, but direct file system access:

- `getData<T>(path: string)` - Direct file read
- `setData(path: string, data: any)` - Direct file write
- `updateData(path: string, data: any)` - Direct file update
- `pushData(path: string, data: any)` - Direct file append
- `deleteData(path: string)` - Direct file delete
- `getChannel(channelId: string)` - Get channel
- `getChannelParticipants(channelId: string)` - Get participants
- `getLatestSnapshot(channelId: string)` - Get latest snapshot
- `getChannelUserBalances(channelId: string)` - Get balances
- `getCurrentStateNumber(channelId: string)` - Get state number

## Migration Guide

### From Server-Side to Client-Side

If you need to use DB functions in a client component:

1. **Change import**:
   ```typescript
   // Before
   import { getChannel } from "@/lib/db";
   
   // After
   import { getChannel } from "@/lib/db-client";
   ```

2. **No code changes needed** - Function signatures are identical

3. **Handle async properly** - All functions are async:
   ```typescript
   const channel = await getChannel("123");
   ```

### From Client-Side to Server-Side

If you're in an API route or server component:

1. **Change import**:
   ```typescript
   // Before
   import { getChannel } from "@/lib/db-client";
   
   // After
   import { getChannel } from "@/lib/db";
   ```

2. **No code changes needed** - Function signatures are identical

## Examples

### Client Component Example

```typescript
"use client";

import { useState, useEffect } from "react";
import { getChannel, getChannelParticipants } from "@/lib/db-client";

export function ChannelInfo({ channelId }: { channelId: string }) {
  const [channel, setChannel] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [channelData, participantsData] = await Promise.all([
        getChannel(channelId),
        getChannelParticipants(channelId),
      ]);
      setChannel(channelData);
      setParticipants(participantsData);
    }
    loadData();
  }, [channelId]);

  return <div>...</div>;
}
```

### API Route Example

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getChannel, updateChannel } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const channel = await getChannel(params.id);
  return NextResponse.json({ channel });
}
```

## Troubleshooting

### Error: "Module not found: Can't resolve 'fs'"

**Cause**: Importing `@/lib/db` in a client component.

**Solution**: Change import to `@/lib/db-client`.

### Error: "Cannot use import statement outside a module"

**Cause**: Trying to use `@/lib/db-client` in a server component.

**Solution**: Use `@/lib/db` in server-side code.

### Data Not Updating

**Check**:
1. Are you using the correct module for your context?
2. Is the API route (`/api/db`) working?
3. Are paths using dot notation correctly?

## Best Practices

1. **Always check file type**: Look for `"use client"` directive
2. **Use TypeScript**: Both modules export the same types
3. **Handle errors**: Client-side functions may fail due to network issues
4. **Cache when possible**: Client-side calls are HTTP requests
5. **Use server-side when possible**: Direct file access is faster

---

**Last Updated**: 2026-01-11
**Status**: Active - Critical for build success
