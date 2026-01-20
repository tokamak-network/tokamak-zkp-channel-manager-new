# First Transfer State Snapshot Handling

## Overview

This document explains how the application handles state snapshots for the first transfer simulation in a channel. Unlike subsequent transfers, the first transfer does not have a previous state snapshot stored in the database, so the application fetches the initial state directly from the blockchain.

## Problem Statement

When creating the first L2 transaction in a channel (first transfer simulation), there is no previous state snapshot in the database because no transactions have been executed yet. However, the synthesizer requires a state snapshot to simulate the transaction.

## Solution: On-Chain Initial State Fetching

The application implements a fallback mechanism that fetches the initial channel state from the blockchain when no state snapshot exists in the database.

## Implementation Details

### Flow Diagram

```
1. User creates first L2 transaction
   ↓
2. TransactionBundleModal tries to get state snapshot from DB
   ↓
3. No snapshot found in DB (first transfer)
   ↓
4. Fetch initial state from blockchain using fetchChannelInitialState()
   ↓
5. Construct StateSnapshot object from on-chain data
   ↓
6. Use this snapshot for synthesizer
```

### Code Flow

#### 1. TransactionBundleModal.tsx

The `handleSynthesizerDownload` function follows this logic:

```typescript
// Step 1: Try to get snapshot from bundleData
let previousStateSnapshot = bundleData?.snapshot || null;

// Step 2: Try to get from latest verified proof API
if (previousStateSnapshot === null) {
  const response = await fetch(
    `/api/get-latest-state-snapshot?channelId=${selectedChannelId}`
  );
  if (response.ok) {
    const data = await response.json();
    previousStateSnapshot = data.snapshot;
  }
}

// Step 3: If still no snapshot, fetch initial state from on-chain
if (previousStateSnapshot === null) {
  const chainId = await getChainId();
  const initialState = await fetchChannelInitialState(
    selectedChannelId,
    chainId
  );
  previousStateSnapshot = {
    channelId: initialState.channelId,
    stateRoot: initialState.stateRoot,
    registeredKeys: initialState.registeredKeys,
    storageEntries: initialState.storageEntries,
    contractAddress: initialState.contractAddress,
    preAllocatedLeaves: initialState.preAllocatedLeaves,
  } as StateSnapshot;
}
```

#### 2. fetchChannelInitialState.ts

This function fetches the initial channel state from the blockchain:

**Data Fetched:**
- Channel info (target contract, initial root)
- Channel participants
- Pre-allocated keys and leaves
- Participant MPT keys and deposits

**Returns:**
```typescript
{
  channelId: number;
  stateRoot: string;           // initialRoot from getChannelInfo
  registeredKeys: string[];    // All MPT keys (pre-allocated + participants)
  storageEntries: Array<{      // Storage key-value pairs
    key: string;               // MPT key
    value: string;             // Deposit amount
  }>;
  contractAddress: string;     // Target contract address
  preAllocatedLeaves: Array<{  // Pre-allocated storage entries
    key: string;
    value: string;
  }>;
}
```

### Contract Calls

The function makes the following contract calls to `BridgeCore`:

1. **`getChannelInfo(channelId)`**
   - Returns: `[targetContract, state, participantCount, initialRoot]`
   - Used to get `initialRoot` (becomes `stateRoot` in snapshot)

2. **`getChannelParticipants(channelId)`**
   - Returns: Array of participant addresses
   - Used to fetch each participant's MPT key and deposit

3. **`getPreAllocatedKeys(targetContract)`**
   - Returns: Array of pre-allocated storage keys
   - Used to fetch pre-allocated storage entries

4. **`getPreAllocatedLeaf(targetContract, key)`**
   - Returns: `[value, exists]`
   - Used to get pre-allocated storage values

5. **`getL2MptKey(channelId, participant)`**
   - Returns: Participant's L2 MPT key
   - Used to construct storage entries

6. **`getParticipantDeposit(channelId, participant)`**
   - Returns: Participant's deposit amount
   - Used to construct storage entries

## Comparison with Original Repository

### Original Implementation

The original repository (`Tokamak-zkp-channel-manager`) uses a similar approach:

```typescript
// From TransactionBundleModal.tsx (lines 339-357)
let previousStateSnapshot = await getLatestStateSnapshot(selectedChannelId);
if (previousStateSnapshot === null) {
  const channelId = Number(addHexPrefix(selectedChannelId));
  const channelData = await fetchChannelData(
    ETHERS_RPC_URL, 
    channelId,
  );
  previousStateSnapshot = {
    channelId,
    stateRoot: channelData.initialRoot,
    registeredKeys: channelData.registeredKeys,
    storageEntries: channelData.storageEntries,
    contractAddress: channelData.contractAddress,
    preAllocatedLeaves: channelData.preAllocatedLeaves,
  };
}
```

### Key Differences

1. **RPC URL Handling**: 
   - Original: Uses `ETHERS_RPC_URL` constant
   - New: Uses Wagmi chain configuration to get RPC URL dynamically

2. **Contract Interaction**:
   - Original: Uses `ethers.js` directly with `JsonRpcProvider`
   - New: Uses `@wagmi/core`'s `readContracts` for better integration with Wagmi

3. **Chain ID**:
   - Original: Assumes single network
   - New: Dynamically gets chain ID from Wagmi config

## When This Logic is Used

This fallback mechanism is triggered when:

1. **First Transfer Simulation**: No previous transactions have been executed in the channel
2. **No State Snapshots in DB**: The database doesn't contain any state snapshots for the channel
3. **No Verified Proofs**: There are no verified proofs that would have generated state snapshots

## State Snapshot Structure

The `StateSnapshot` type (from `tokamak-l2js`) requires:

```typescript
{
  channelId: number;
  stateRoot: string;              // Merkle root of the state tree
  registeredKeys: string[];       // All registered storage keys
  storageEntries: Array<{         // Key-value pairs for storage
    key: string;
    value: string;
  }>;
  contractAddress: string;        // Target contract address
  preAllocatedLeaves: Array<{     // Pre-allocated storage entries
    key: string;
    value: string;
  }>;
}
```

## Important Notes

1. **Initial Root**: The `stateRoot` comes from the `initialRoot` returned by `getChannelInfo`, which is set during channel initialization.

2. **Pre-allocated Leaves**: These are storage entries that exist before any deposits, typically for contract-specific storage slots.

3. **Participant Data**: Each participant's MPT key and deposit amount are fetched separately and combined into `storageEntries`.

4. **Registered Keys**: All keys (both pre-allocated and participant MPT keys) are collected in `registeredKeys` for the synthesizer.

## Error Handling

If fetching the initial state from on-chain fails, the error message will indicate:

```
Could not find previous state snapshot and failed to fetch initial state from on-chain: [error message]
```

This ensures users understand that both the database lookup and on-chain fallback failed.

## Testing

To test the first transfer simulation:

1. Create a new channel
2. Initialize the channel state
3. **Do NOT** execute any transactions yet
4. Open Transaction Bundle Modal
5. Create the first L2 transaction
6. The system should automatically fetch the initial state from on-chain

## Related Files

- `components/TransactionBundleModal.tsx` - Main modal component
- `lib/fetchChannelInitialState.ts` - On-chain state fetching function
- `app/initialize-state/_hooks/useGenerateInitialProof.ts` - Similar logic for proof generation
- `lib/db-client.ts` - Database client functions

## Date

This document was created on: 2024-12-19

---

**Note**: This behavior matches the original repository's implementation, ensuring compatibility with existing workflows.
