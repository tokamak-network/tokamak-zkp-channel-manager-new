# Contract Hooks Usage Guide

This guide explains how to use the centralized contract hooks in this project. All contract interactions should go through the hooks in `hooks/contract` rather than directly using Wagmi hooks.

## Overview

All contract-related hooks are centralized in `hooks/contract` and automatically use contract addresses and ABIs from `@tokamak/config`. This ensures:

- ✅ **Automatic network detection**: Uses the correct contract address for the current network
- ✅ **Type safety**: Full TypeScript support with proper types
- ✅ **Wagmi integration**: Leverages all Wagmi features
- ✅ **Centralized configuration**: Addresses and ABIs managed in `@tokamak/config`
- ✅ **Consistency**: All components use the same pattern for contract interactions

## Available Contracts

The following contracts have dedicated hooks:

- **BridgeCore**: Channel creation and management
- **BridgeDepositManager**: Token deposits
- **BridgeProofManager**: Zero-knowledge proof management
- **BridgeWithdrawManager**: Token withdrawals

## Hook Pattern

Each contract provides three types of hooks:

1. **Read hooks**: For reading contract state
2. **Write hooks**: For writing transactions
3. **Wait hooks**: For waiting for transaction receipts

## Usage Examples

### Reading from Contracts

```tsx
import { useBridgeCoreRead } from '@/hooks/contract';

function MyComponent() {
  const { data, isLoading, error } = useBridgeCoreRead({
    functionName: 'getChannelInfo',
    args: [channelId],
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.toString()}</div>;
}
```

### Writing to Contracts

```tsx
import { useBridgeCoreWrite, useBridgeCoreWaitForReceipt } from '@/hooks/contract';

function MyComponent() {
  const { writeContract, data: txHash, isPending } = useBridgeCoreWrite();
  const { isLoading: isWaiting, isSuccess } = useBridgeCoreWaitForReceipt({
    hash: txHash,
  });

  const handleCreateChannel = async () => {
    await writeContract({
      functionName: 'openChannel',
      args: [{
        targetContract: '0x...',
        whitelisted: ['0x...'],
        enableFrostSignature: false,
      }],
    });
  };

  return (
    <button 
      onClick={handleCreateChannel}
      disabled={isPending || isWaiting}
    >
      {isPending ? 'Creating...' : 'Create Channel'}
    </button>
  );
}
```

### Getting Contract Address and ABI

If you need the contract address or ABI directly:

```tsx
import { useBridgeCoreAddress, useBridgeCoreAbi } from '@/hooks/contract';

function MyComponent() {
  const address = useBridgeCoreAddress();
  const abi = useBridgeCoreAbi();
  
  // Use address and abi as needed
}
```

## Available Hooks by Contract

### BridgeCore

- `useBridgeCoreAddress()`: Get contract address
- `useBridgeCoreAbi()`: Get contract ABI
- `useBridgeCoreRead(config)`: Read from contract
- `useBridgeCoreWrite()`: Write to contract (returns `useWriteContract()`)
- `useBridgeCoreWrite()`: Write with auto address/ABI
- `useBridgeCoreWaitForReceipt(config)`: Wait for transaction receipt

### BridgeDepositManager

- `useBridgeDepositManagerAddress()`: Get contract address
- `useBridgeDepositManagerRead(config)`: Read from contract
- `useBridgeDepositManagerWrite()`: Write to contract
- `useBridgeDepositManagerWaitForReceipt(config)`: Wait for transaction receipt

### BridgeProofManager

- `useBridgeProofManagerAddress()`: Get contract address
- `useBridgeProofManagerRead(config)`: Read from contract
- `useBridgeProofManagerWrite()`: Write to contract
- `useBridgeProofManagerWaitForReceipt(config)`: Wait for transaction receipt

### BridgeWithdrawManager

- `useBridgeWithdrawManagerAddress()`: Get contract address
- `useBridgeWithdrawManagerRead(config)`: Read from contract
- `useBridgeWithdrawManagerWrite()`: Write to contract
- `useBridgeWithdrawManagerWaitForReceipt(config)`: Wait for transaction receipt

## Custom Hooks Pattern

When creating custom hooks that interact with contracts, use the contract hooks instead of direct Wagmi hooks:

### ✅ Correct Pattern

```tsx
// app/create-channel/_hooks/useDeposit.ts
import { useBridgeDepositManagerWrite, useBridgeDepositManagerWaitForReceipt } from '@/hooks/contract';

export function useDeposit({ channelId, depositAmount, mptKey }) {
  const { writeContract, data: txHash } = useBridgeDepositManagerWrite();
  const { isLoading, isSuccess, error } = useBridgeDepositManagerWaitForReceipt({
    hash: txHash,
  });

  const handleDeposit = async () => {
    await writeContract({
      functionName: 'depositToken',
      args: [channelId, amount, mptKey],
    });
  };

  return { handleDeposit, isDepositing: isLoading, depositTxHash: txHash };
}
```

### ❌ Incorrect Pattern

```tsx
// DON'T do this - directly using Wagmi hooks
import { useWriteContract } from 'wagmi';

export function useDeposit() {
  const { writeContract } = useWriteContract(); // ❌ Don't use directly
  
  // ...
}
```

## Import Path

All contract hooks can be imported from the centralized index:

```tsx
import {
  useBridgeCoreRead,
  useBridgeCoreWrite,
  useBridgeDepositManagerWrite,
  // ... etc
} from '@/hooks/contract';
```

Or import from specific files:

```tsx
import { useBridgeCoreRead } from '@/hooks/contract/useBridgeCore';
import { useBridgeDepositManagerWrite } from '@/hooks/contract/useBridgeDepositManager';
```

## Best Practices

1. **Always use contract hooks**: Never use `useWriteContract`, `useReadContract`, etc. directly from Wagmi
2. **Use centralized imports**: Import from `@/hooks/contract` for consistency
3. **Create custom hooks**: For complex contract interactions, create custom hooks that use the contract hooks
4. **Handle loading and error states**: Always check `isLoading` and `error` states
5. **Wait for receipts**: Use the wait hooks to confirm transaction completion

## Migration Guide

If you find code using Wagmi hooks directly, migrate it to use contract hooks:

### Before

```tsx
import { useWriteContract } from 'wagmi';
import { getContractAddress, getContractAbi } from '@tokamak/config';

function MyComponent() {
  const networkId = useNetworkId();
  const address = getContractAddress('BridgeCore', networkId);
  const abi = getContractAbi('BridgeCore');
  
  const { writeContract } = useWriteContract();
  
  const handleAction = () => {
    writeContract({
      address,
      abi,
      functionName: 'someFunction',
      args: [...],
    });
  };
}
```

### After

```tsx
import { useBridgeCoreWrite } from '@/hooks/contract';

function MyComponent() {
  const { writeContract } = useBridgeCoreWrite();
  
  const handleAction = () => {
    writeContract({
      functionName: 'someFunction',
      args: [...],
    });
  };
}
```

## Related Documentation

- [Wagmi Configuration](./wagmi.md): Wagmi setup and configuration
- [Contract Configuration](../../packages/config/README.md): Contract addresses and ABIs
