# Contract Hooks Usage Guide

This document explains how to use contract hooks in the Tokamak ZKP Channel Manager application.

## Overview

Contract hooks provide a simplified interface for interacting with smart contracts. They automatically handle:
- Contract address resolution based on the current network
- ABI configuration
- Type safety with TypeScript

## Available Contract Hooks

### BridgeCore
- `useBridgeCoreRead(config)` - Read from BridgeCore contract
- `useBridgeCoreWrite()` - Write to BridgeCore contract (address/abi auto-configured)
- `useBridgeCoreWaitForReceipt(config)` - Wait for transaction receipt

### BridgeProofManager
- `useBridgeProofManagerRead(config)` - Read from BridgeProofManager contract
- `useBridgeProofManagerWrite()` - Write to BridgeProofManager contract (address/abi auto-configured)
- `useBridgeProofManagerWaitForReceipt(config)` - Wait for transaction receipt

### BridgeDepositManager
- `useBridgeDepositManagerRead(config)` - Read from BridgeDepositManager contract
- `useBridgeDepositManagerWrite()` - Write to BridgeDepositManager contract (address/abi auto-configured)
- `useBridgeDepositManagerWaitForReceipt(config)` - Wait for transaction receipt

### BridgeWithdrawManager
- `useBridgeWithdrawManagerRead(config)` - Read from BridgeWithdrawManager contract
- `useBridgeWithdrawManagerWrite()` - Write to BridgeWithdrawManager contract (address/abi auto-configured)
- `useBridgeWithdrawManagerWaitForReceipt(config)` - Wait for transaction receipt

## Writing to Contracts

### Simplified API (Recommended)

All `Write` hooks now automatically configure `address` and `abi`. You only need to provide `functionName` and `args`:

```typescript
import { useBridgeProofManagerWrite } from '@/hooks/contract';

function MyComponent() {
  const { writeContract, isPending, error } = useBridgeProofManagerWrite();

  const handleAction = async () => {
    try {
      await writeContract({
        functionName: "initializeChannelState",
        args: [channelId, proofStruct],
      });
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  return (
    <button onClick={handleAction} disabled={isPending}>
      {isPending ? "Processing..." : "Execute"}
    </button>
  );
}
```

### Benefits

1. **Less Boilerplate**: No need to manually get address and ABI
2. **Type Safety**: TypeScript ensures correct function names and argument types
3. **Network Awareness**: Automatically uses the correct contract address for the current network
4. **Consistency**: Same pattern across all contract hooks
5. **Error Prevention**: Reduces risk of using wrong address/ABI combination

## Reading from Contracts

Reading hooks already had this pattern. They automatically configure address and ABI:

```typescript
import { useBridgeCoreRead } from '@/hooks/contract';

function MyComponent() {
  const { data, isLoading, error } = useBridgeCoreRead({
    functionName: "getChannelState",
    args: [channelId],
    query: {
      enabled: !!channelId,
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Channel State: {data}</div>;
}
```

## Waiting for Transaction Receipt

All hooks provide a `WaitForReceipt` hook for monitoring transaction status:

```typescript
import { 
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt 
} from '@/hooks/contract';

function MyComponent() {
  const { writeContract, data: txHash } = useBridgeProofManagerWrite();
  
  const { isLoading, isSuccess, error } = useBridgeProofManagerWaitForReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
      retry: true,
    },
  });

  const handleAction = async () => {
    await writeContract({
      functionName: "initializeChannelState",
      args: [channelId, proofStruct],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      console.log("Transaction confirmed!");
    }
  }, [isSuccess]);

  return (
    <button onClick={handleAction} disabled={isLoading}>
      {isLoading ? "Processing..." : "Execute"}
    </button>
  );
}
```

## Migration Guide

### Before (Old Pattern)

```typescript
import { 
  useBridgeProofManagerWrite,
  useBridgeProofManagerAddress 
} from '@/hooks/contract';
import { getContractAbi } from '@tokamak/config';

function MyComponent() {
  const proofManagerAddress = useBridgeProofManagerAddress();
  const proofManagerAbi = getContractAbi("BridgeProofManager");
  const { writeContract } = useBridgeProofManagerWrite();

  const handleAction = async () => {
    await writeContract({
      address: proofManagerAddress,
      abi: proofManagerAbi,
      functionName: "initializeChannelState",
      args: [channelId, proofStruct],
    });
  };
}
```

### After (New Pattern)

```typescript
import { useBridgeProofManagerWrite } from '@/hooks/contract';

function MyComponent() {
  const { writeContract } = useBridgeProofManagerWrite();

  const handleAction = async () => {
    await writeContract({
      functionName: "initializeChannelState",
      args: [channelId, proofStruct],
    });
  };
}
```

## Best Practices

1. **Always use contract hooks**: Don't use `useWriteContract` directly
2. **Handle loading states**: Use `isPending` to show loading indicators
3. **Handle errors**: Always wrap `writeContract` calls in try-catch
4. **Wait for receipts**: Use `WaitForReceipt` hooks to monitor transaction status
5. **Enable queries conditionally**: Use `query.enabled` to control when reads execute

## Examples

### Complete Example: Initialize Channel State

```typescript
import { useState } from 'react';
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
} from '@/hooks/contract';

function InitializeChannelButton({ channelId }: { channelId: `0x${string}` }) {
  const [proof, setProof] = useState(null);

  const { writeContract, data: txHash, isPending: isWriting } = 
    useBridgeProofManagerWrite();

  const { isLoading: isWaiting, isSuccess, error } = 
    useBridgeProofManagerWaitForReceipt({
      hash: txHash,
      query: { enabled: !!txHash },
    });

  const handleInitialize = async () => {
    try {
      await writeContract({
        functionName: "initializeChannelState",
        args: [channelId, proof],
      });
    } catch (err) {
      console.error("Failed to initialize:", err);
    }
  };

  const isProcessing = isWriting || isWaiting;

  return (
    <div>
      <button 
        onClick={handleInitialize} 
        disabled={isProcessing || !proof}
      >
        {isProcessing ? "Processing..." : "Initialize Channel"}
      </button>
      
      {isSuccess && <div>Channel initialized successfully!</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Example: Deposit Tokens

```typescript
import { useBridgeDepositManagerWrite } from '@/hooks/contract';

function DepositButton({ channelId, amount, mptKey }: DepositProps) {
  const { writeContract, isPending } = useBridgeDepositManagerWrite();

  const handleDeposit = async () => {
    try {
      await writeContract({
        functionName: "depositToken",
        args: [channelId, amount, mptKey],
      });
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  return (
    <button onClick={handleDeposit} disabled={isPending}>
      {isPending ? "Depositing..." : "Deposit"}
    </button>
  );
}
```

## Type Safety

All hooks are fully typed. TypeScript will:
- Autocomplete function names
- Validate argument types
- Check argument count
- Provide return type information

```typescript
// TypeScript will error if functionName doesn't exist
await writeContract({
  functionName: "nonExistentFunction", // ❌ Type error
  args: [],
});

// TypeScript will error if args don't match function signature
await writeContract({
  functionName: "initializeChannelState",
  args: [channelId], // ❌ Type error: missing proofStruct
});
```

## Network Support

Contract hooks automatically use the correct contract address based on:
1. The currently connected network (from wagmi)
2. Network configuration in `@tokamak/config`

No manual network switching required - hooks handle it automatically.

## Troubleshooting

### Transaction Fails

1. Check that you're on the correct network
2. Verify function name and arguments are correct
3. Check contract state (e.g., channel must be in correct state)
4. Ensure you have sufficient gas

### Type Errors

1. Verify function name exists in contract ABI
2. Check argument types match function signature
3. Ensure all required arguments are provided

### Address/ABI Mismatch

This should not happen with the new hooks, but if you see errors:
1. Verify network configuration in `@tokamak/config`
2. Check that contract addresses are deployed for current network
3. Ensure ABI matches the deployed contract version

## See Also

- [Contract Hooks README](../hooks/contract/README.md)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
