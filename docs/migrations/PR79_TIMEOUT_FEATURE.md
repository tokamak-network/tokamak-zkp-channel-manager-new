# PR #79 Migration Guide: Timeout Feature for Bridge Protocol

> **Status**: Pending (Execute after PR is merged)
> **PR URL**: https://github.com/tokamak-network/Tokamak-zk-EVM-contracts/pull/79
> **Branch**: feat/timeout → new-groth16

## Overview

This document outlines the changes required in the manager app after Tokamak-zk-EVM-contracts PR #79 (Timeout Feature for Bridge Protocol) is merged.

### Key Feature Changes

1. **7-day timeout constant** - Applied to all channels
2. **User Storage Slots concept** - Support for additional storage beyond balance
3. **Timeout withdrawal feature** - Users can withdraw initial deposits if proofs aren't submitted
4. **Storage structure simplification** - Removal of unnecessary variables/functions

---

## Breaking Changes

### 1. Removed Functions

| Removed Function | Replacement |
|-----------------|-------------|
| `getParticipantDeposit(channelId, participant)` | `getValidatedUserStorage(channelId, participant, targetContract)` |
| `getChannelTotalDeposits(channelId)` | Removed (no longer used) |
| `isChannelParticipant(channelId, participant)` | Use `isChannelWhitelisted()` or check `getChannelParticipants()` array |
| `withdrawOnTimeout(channelId)` | Merged into regular `withdraw()` function |

### 2. Renamed Functions

| Old Function Name | New Function Name |
|-------------------|-------------------|
| `getWithdrawableAmount(channelId, participant, targetContract)` | `getValidatedUserStorage(channelId, participant, targetContract)` |
| `setChannelWithdrawAmounts()` | `setChannelValidatedUserStorage()` |
| `clearWithdrawableAmount()` | `clearValidatedUserStorage()` |

### 3. Signature Changes

```solidity
// Before
function updateChannelUserDeposits(bytes32 channelId, address participant, uint256 amount);
function isMarkedChannelLeader(address addr) returns (bool);

// After
function updateChannelUserDeposits(bytes32 channelId, address participant, address targetContract, uint256 amount);
function isMarkedChannelLeader(address addr, bytes32 channelId) returns (bool);
```

### 4. New Functions

```solidity
// Check if channel has timed out
function isChannelTimedOut(bytes32 channelId) external view returns (bool);

// Constant
uint256 public constant CHANNEL_TIMEOUT = 7 days;
```

---

## Storage Structure Changes

### Removed Structs/Variables

```solidity
// Removed
struct UserChannelData {
    uint256 deposit;
    uint256 l2MptKey;
    bool isParticipant;
}

// Removed from Channel struct
uint256 totalDeposits;
mapping(address => UserChannelData) userData;
mapping(address => bool) isChannelLeader;
mapping(bytes32 => mapping(address => bool)) hasTimeoutWithdrawn;
mapping(address => uint256) channelLeaderCount;
```

### New Structs

```solidity
struct UserStorageSlot {
    uint8 slotOffset;
    bytes32 getterFunctionSignature;
}

struct Withdrawal {
    uint256 amount;
    bool isLocked;
}

// Unified into validatedUserStorage
mapping(address => mapping(bytes32 => mapping(address => Withdrawal))) validatedUserStorage;
// Usage: validatedUserStorage[USER_ADDRESS][CHANNEL_ID][CONTRACT_ADDRESS]

// Remaining in Channel struct
mapping(address => uint256) l2MptKey;  // Direct mapping instead of userData
```

---

## Max Participants Calculation Changes

### Important: userStorageSlots Already Includes Balance Slot

```solidity
// Wrong calculation (adding +1 for balance separately)
totalEntries = preAllocatedCount + (participants.length * (1 + userStorageSlotsCount));

// Correct calculation (userStorageSlots already includes balance)
totalEntries = preAllocatedCount + (participants.length * userStorageSlotsCount);
```

### maxAllowedParticipants Calculation

```solidity
// Leader is counted as a participant (no separate -1)
uint256 numberOfUserStorageSlot = $.allowedTargetContracts[targetContract].userStorageSlots.length + 1;
uint256 maxAllowedParticipants = (MAX_PARTICIPANTS / numberOfUserStorageSlot) - preAllocatedCount;
```

---

## R_MOD Validation Location Change

```solidity
// Removed from BridgeProofManager
// uint256 modedL2MptKey = l2MptKey % R_MOD;  // Removed

// Added to BridgeCore setter functions
function setChannelL2MptKey(...) {
    require(mptKey < R_MOD, "MPT key exceeds R_MOD");
    // ...
}

function updateChannelUserDeposits(...) {
    require(amount < R_MOD, "Amount exceeds R_MOD");
    // ...
}
```

---

## Affected Files in Manager App

### Phase 1: ABI Update (Required)

**File**: `packages/config/src/contracts/abis.ts`

```typescript
// Functions to remove
- getParticipantDeposit
- getChannelTotalDeposits
- isChannelParticipant

// Functions to add/modify
+ getValidatedUserStorage(channelId, participant, targetContract) returns (uint256)
+ isChannelTimedOut(channelId) returns (bool)
~ isMarkedChannelLeader(addr, channelId) returns (bool)  // channelId parameter added
```

### Phase 2: Function Call Changes (15+ files)

| File Path | Change Required |
|-----------|-----------------|
| `hooks/useChannelUserBalance.ts` | `getParticipantDeposit` → `getValidatedUserStorage` + add targetContract param |
| `hooks/useChannelBalance.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `hooks/useTransactionHistory.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `hooks/useChannelParticipantCheck.ts` | Note: `isChannelParticipant` removed |
| `app/state-explorer/layout.tsx` | `getWithdrawableAmount` → `getValidatedUserStorage` |
| `app/state-explorer/page.tsx` | `getWithdrawableAmount` → `getValidatedUserStorage` |
| `app/state-explorer/_components/ChannelStepper.tsx` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `app/state-explorer/_components/ParticipantDeposits.tsx` | Change 8 `getParticipantDeposit` calls |
| `app/state-explorer/_hooks/useGenerateInitialProof.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `app/state-explorer/_hooks/usePreviousStateSnapshot.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `app/state-explorer/withdraw/_hooks/useWithdraw.ts` | `getWithdrawableAmount` → `getValidatedUserStorage` |
| `app/state-explorer/[channelId]/[proofId]/page.tsx` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `app/initialize-state/_hooks/useGenerateInitialProof.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `app/api/get-contract-state-for-proof/route.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |
| `lib/fetchChannelInitialState.ts` | `getParticipantDeposit` → `getValidatedUserStorage` |

### Phase 3: Timeout UI Addition (Optional)

1. **Timeout Status Display**
   - Call `isChannelTimedOut()` to check channel timeout status
   - Display 7-day countdown timer

2. **Withdrawal Button Condition Change**
   - Before: Withdrawal only when channel is in Closed state
   - After: Withdrawal when channel is Closed OR timed out

---

## Code Conversion Example

### Before

```typescript
// Old code
const { data: deposit } = useBridgeCoreRead({
  functionName: "getParticipantDeposit",
  args: [channelId, participantAddress],
});
```

### After

```typescript
// New code
const { data: deposit } = useBridgeCoreRead({
  functionName: "getValidatedUserStorage",
  args: [channelId, participantAddress, targetContractAddress],
});
```

---

## Checklist

- [ ] Update ABI file (`packages/config/src/contracts/abis.ts`)
- [ ] Change `getParticipantDeposit` → `getValidatedUserStorage` (all files)
- [ ] Change `getWithdrawableAmount` → `getValidatedUserStorage`
- [ ] Add `targetContract` parameter to all calls
- [ ] Add UI utilizing `isChannelTimedOut()` function (optional)
- [ ] Update documentation (`claude.md`, `docs/CHANNEL_STATE.md`, etc.)

---

## References

- [PR #79](https://github.com/tokamak-network/Tokamak-zk-EVM-contracts/pull/79)
- [Jake's Notion - Formula Reference](https://www.notion.so/tokamak/Jake-2eed96a400a380e2a760d7aafed5f306)

---

## Update History

| Date | Content |
|------|---------|
| 2026-01-22 | Initial draft |
