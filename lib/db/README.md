# Database Module

Common database API module. Provides a local JSON file-based database using lowdb.

## Installation

```bash
npm install lowdb
```

## Structure

```
lib/db/
├── client.ts      # lowdb client initialization
├── helpers.ts     # Common CRUD functions
├── channels.ts    # Channel-specific functions
├── index.ts       # Module exports
└── README.md      # This file
```

## Usage

### Basic CRUD Operations

```typescript
import { getData, setData, pushData, updateData, deleteData } from '@/lib/db';

// Read data
const channel = await getData('channels.123');

// Write data
await setData('channels.123', { status: 'active' });

// Add to array/object (auto-generated key)
const key = await pushData('channels.123.proofs', { proofData: '...' });

// Update data (merge)
await updateData('channels.123', { status: 'closed' });

// Delete data
await deleteData('channels.123');
```

### Channel-specific Functions

```typescript
import {
  getChannel,
  getAllChannels,
  getActiveChannels,
  saveChannel,
  updateChannel,
  deleteChannel,
  getChannelParticipants,
  getChannelSnapshots,
  getLatestSnapshot,
  getProofs,
  getCurrentStateNumber,
} from '@/lib/db';

// Query channels
const channel = await getChannel('123');
const allChannels = await getAllChannels();
const activeChannels = await getActiveChannels();

// Save/update channel
await saveChannel('123', {
  status: 'active',
  targetContract: '0x...',
  participants: ['0x...', '0x...'],
});

await updateChannel('123', { status: 'closed' });

// Query participants
const participants = await getChannelParticipants('123');

// Query snapshots
const snapshots = await getChannelSnapshots('123', 10); // Latest 10
const latest = await getLatestSnapshot('123');

// Query proofs
const submittedProofs = await getProofs('123', 'submitted');
const verifiedProofs = await getProofs('123', 'verified');

// Get current state number
const nextStateNumber = await getCurrentStateNumber('123');
```

## Usage in API Routes

```typescript
// app/api/channels/route.ts
import { NextResponse } from 'next/server';
import { getActiveChannels } from '@/lib/db';

export async function GET() {
  const channels = await getActiveChannels();
  return NextResponse.json({ success: true, data: channels });
}
```

## Data Structure

Data is stored in the `data/db.json` file:

```json
{
  "channels": {
    "123": {
      "channelId": "123",
      "status": "active",
      "targetContract": "0x...",
      "participants": ["0x...", "0x..."],
      "participants": {
        "0x...": {
          "address": "0x...",
          "_createdAt": "2026-01-08T..."
        }
      },
      "stateSnapshots": {
        "snapshot-1": {
          "sequenceNumber": 1,
          "merkleRoot": "0x...",
          "_createdAt": "2026-01-08T..."
        }
      },
      "submittedProofs": {},
      "verifiedProofs": {},
      "rejectedProofs": {},
      "_createdAt": "2026-01-08T...",
      "_updatedAt": "2026-01-08T..."
    }
  }
}
```

## Important Notes

1. **Server-side only**: This module can only be used in Next.js API routes. Do not use it in client components.

2. **File path**: The database file is stored at `data/db.json`. This directory is created automatically.

3. **Timestamps**: All data automatically includes `_createdAt` or `_updatedAt` timestamps.

4. **Path notation**: Paths can be separated by dots (.) or slashes (/):
   - `channels.123` or `channels/123`
   - `channels.123.participants.0x...` or `channels/123/participants/0x...`

## Compatibility with Legacy Code

Provides a similar API to the legacy `lib/realtime-db-helpers.ts`:

| Legacy (Firebase) | New (lowdb) |
|------------------|-------------|
| `getChannel(id)` | `getChannel(id)` |
| `getActiveChannels()` | `getActiveChannels()` |
| `getData(path)` | `getData(path)` |
| `setData(path, data)` | `setData(path, data)` |
| `pushData(path, data)` | `pushData(path, data)` |
| `updateData(path, data)` | `updateData(path, data)` |
| `deleteData(path)` | `deleteData(path)` |

## Migration Guide

Migrating from legacy code to the new DB module:

```typescript
// Before (Firebase)
import { getChannel, getData } from '@/lib/realtime-db-helpers';

// After (lowdb)
import { getChannel, getData } from '@/lib/db';
```

The API is the same, so you only need to change the import path.
