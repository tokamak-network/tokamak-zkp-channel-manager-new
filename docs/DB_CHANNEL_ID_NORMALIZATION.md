# Database Data Normalization Specification

## Overview

This document specifies the data normalization rules for database storage and retrieval operations. All Ethereum addresses, transaction hashes, and channel IDs are normalized to lowercase for consistent storage, while API endpoints accept data in any case format for user convenience.

## Core Principles

1. **Storage Normalization**: All Ethereum addresses, transaction hashes, and channel IDs are stored in lowercase format in the database
2. **Case-Insensitive Lookup**: API endpoints and database functions accept data in any case (uppercase, lowercase, mixed)
3. **Consistent Retrieval**: All database queries normalize data to lowercase before lookup
4. **Automatic Normalization**: All save/update operations automatically normalize Ethereum-related values

## Storage Rules

### Normalized Data Types

The following data types are automatically normalized to lowercase:
- **Channel IDs** (bytes32 hex strings)
- **Ethereum Addresses** (targetContract, participants, user addresses)
- **Transaction Hashes** (initializationTxHash, openChannelTxHash, etc.)
- **Any hex string starting with 0x**

### Save Operations

All save operations automatically normalize Ethereum addresses, hashes, and channel IDs to lowercase:

```typescript
// ✅ Correct: saveChannel normalizes all Ethereum values automatically
await saveChannel("0xABC123...", {
  channelId: "0xABC123...",
  targetContract: "0xDEF456...",
  participants: ["0xAAA111...", "0xBBB222..."],
  initializationTxHash: "0xCCC333...",
  openChannelTxHash: "0xDDD444..."
});
// All stored in lowercase:
// - channelId: "0xabc123..."
// - targetContract: "0xdef456..."
// - participants: ["0xaaa111...", "0xbbb222..."]
// - initializationTxHash: "0xccc333..."
// - openChannelTxHash: "0xddd444..."

// ✅ Correct: updateChannel normalizes automatically
await updateChannel("0xDEF456...", {
  targetContract: "0xNEW123...",
  participants: ["0xNEW111..."]
});
// All updated values normalized to lowercase
```

**Functions that normalize on save:**
- `saveChannel(channelId, channelData)` - Normalizes channelId, targetContract, participants, all tx hashes
- `updateChannel(channelId, updates)` - Normalizes all Ethereum values in updates
- `saveParticipant(channelId, address, data)` - Normalizes channelId and participant address
- `saveSnapshot(channelId, snapshotData)` - Normalizes channelId
- `saveUserBalance(channelId, address, balanceData)` - Normalizes channelId and user address
- `saveProof(channelId, type, proofData)` - Normalizes channelId

### Database Structure

Channels are stored with all Ethereum values in lowercase:

```json
{
  "channels": {
    "0x97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde6": {
      "channelId": "0x97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde6",
      "targetContract": "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
      "participants": [
        "0xf9fa94d45c49e879e46ea783fc133f41709f3bc7",
        "0x6233a7c52652282b8b0b85c817537f072228587f"
      ],
      "initializationTxHash": "0xff89e5eb46d1e855ab6078b18db7ff84a1a4b872ebaa5f2cdeea42b5d13c84ab",
      "openChannelTxHash": "0xef77307c0aa9f3932008a45d08eb9f1e607cf0a6cf55b6fd9b1ad1e8e2714609",
      "status": "active",
      ...
    }
  }
}
```

## Retrieval Rules

### Case-Insensitive Lookup

All retrieval functions accept channel IDs in any case and normalize internally:

```typescript
// ✅ All of these work the same way:
await getChannel("0xABC123...");
await getChannel("0xabc123...");
await getChannel("0xAbC123...");
// All return the same channel stored at: channels.0xabc123...
```

**Functions that handle case-insensitive lookup:**
- `getChannel(channelId)` - Gets channel by ID
- `getChannelParticipants(channelId)` - Gets participants
- `getChannelSnapshots(channelId)` - Gets state snapshots
- `getLatestSnapshot(channelId)` - Gets latest snapshot
- `getChannelUserBalances(channelId)` - Gets user balances
- `getProofs(channelId, type)` - Gets proofs by type
- `getCurrentStateNumber(channelId)` - Gets current state number

### Lookup Algorithm

The `getChannel` function uses a two-step lookup process:

1. **Primary Lookup**: Normalize input to lowercase and search directly
   ```typescript
   const normalizedId = channelId.toLowerCase();
   let channel = await getData(`channels.${normalizedId}`);
   ```

2. **Fallback Lookup**: If not found, search all channels with case-insensitive matching
   ```typescript
   if (!channel) {
     const channelsData = await getData('channels');
     const foundKey = Object.keys(channelsData).find(
       (key) => key.toLowerCase() === normalizedId
     );
     if (foundKey) {
       channel = channelsData[foundKey];
     }
   }
   ```

## API Endpoint Behavior

### Request Format

API endpoints accept channel IDs in any case format:

```bash
# All of these work:
GET /api/channels/0xABC123...
GET /api/channels/0xabc123...
GET /api/channels/0xAbC123...
```

### Response Format

All API responses return channel data with normalized (lowercase) channelId:

```json
{
  "success": true,
  "data": {
    "channelId": "0xabc123...",  // Always lowercase
    "status": "active",
    ...
  }
}
```

### API Endpoints

All channel-related API endpoints handle case normalization:

- `GET /api/channels/:id` - Get channel (case-insensitive)
- `PATCH /api/channels/:id` - Update channel (case-insensitive)
- `POST /api/channels/:id/save` - Save channel (normalizes to lowercase)
- `GET /api/channels/:id/proofs` - Get proofs (case-insensitive)

## Client-Side Usage

### Best Practices

While the API accepts any case, it's recommended to normalize on the client side for consistency:

```typescript
// ✅ Recommended: Normalize before API calls
const normalizedChannelId = channelId.toLowerCase();
const response = await fetch(`/api/channels/${encodeURIComponent(normalizedChannelId)}`);

// ✅ Also works: API handles normalization
const response = await fetch(`/api/channels/${encodeURIComponent(channelId)}`);
```

### URL Encoding

Always URL-encode channel IDs when using them in API paths:

```typescript
// ✅ Correct
const encodedId = encodeURIComponent(channelId.toLowerCase());
fetch(`/api/channels/${encodedId}`);

// ❌ Incorrect (may fail with special characters)
fetch(`/api/channels/${channelId}`);
```

## Migration Notes

### Existing Data

If you have existing data with mixed-case channel IDs:

1. The fallback lookup mechanism will find them
2. Consider migrating to lowercase keys for consistency
3. New saves will automatically use lowercase keys

### Migration Script Example

```typescript
// Migrate existing channels to lowercase keys
const channels = await getAllChannels();
for (const channel of channels) {
  if (channel.channelId && channel.channelId !== channel.channelId.toLowerCase()) {
    // Save with normalized key
    await saveChannel(channel.channelId.toLowerCase(), channel);
    // Optionally delete old key if different
  }
}
```

## Error Handling

### Channel Not Found

If a channel is not found, all functions return `null`:

```typescript
const channel = await getChannel("0xINVALID...");
if (!channel) {
  // Channel not found
}
```

### API Error Responses

API endpoints return 404 when channel is not found:

```json
{
  "success": false,
  "error": "Channel not found"
}
```

## Testing

### Test Cases

1. **Save with uppercase, retrieve with lowercase**
   ```typescript
   await saveChannel("0xABC123...", data);
   const channel = await getChannel("0xabc123...");
   // Should find the channel
   ```

2. **Save with lowercase, retrieve with uppercase**
   ```typescript
   await saveChannel("0xabc123...", data);
   const channel = await getChannel("0xABC123...");
   // Should find the channel
   ```

3. **Mixed case in API calls**
   ```typescript
   // Save
   await fetch('/api/channels/0xABC123.../save', { method: 'POST', ... });
   // Retrieve
   await fetch('/api/channels/0xabc123...');
   // Should work
   ```

## Summary

- **Storage**: All Ethereum addresses, hashes, and channel IDs stored in lowercase
- **Lookup**: Case-insensitive (accepts any case)
- **API**: Accepts any case, returns lowercase
- **Client**: Recommended to normalize, but not required
- **Automatic**: All save/update operations automatically normalize

This design ensures:
- ✅ Consistent storage format for all Ethereum-related data
- ✅ User-friendly API (accepts any case)
- ✅ Automatic normalization (no manual conversion needed)
- ✅ Backward compatibility with existing data
- ✅ No breaking changes for clients
