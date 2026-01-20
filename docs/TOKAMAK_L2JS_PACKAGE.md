# Tokamak L2JS Package Usage

## Overview

This project uses the `tokamak-l2js` npm package instead of directly importing from the `Tokamak-Zk-EVM` submodule. This document explains the migration and usage patterns.

## Important: Always Use `tokamak-l2js` Package

**DO NOT** import from submodule paths like:
```typescript
// ❌ WRONG - Do not use submodule paths
import { getEddsaPublicKey } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/crypto";
import { TokamakL2Tx } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/tx/TokamakL2Tx";
```

**DO** import from the npm package:
```typescript
// ✅ CORRECT - Use tokamak-l2js package
import { getEddsaPublicKey, TokamakL2Tx } from "tokamak-l2js";
```

## Available Exports from `tokamak-l2js`

The following functions and types are available from the `tokamak-l2js` package:

### Key Derivation
- `deriveL2KeysFromSignature(signature: \`0x${string}\`)` - Derive L2 keys from MetaMask signature
- `deriveL2AddressFromKeys(keys)` - Derive L2 address from keys
- `deriveL2MptKeyFromAddress(address, slotIndex)` - Derive MPT key from address

### Transaction Creation
- `createTokamakL2Tx(txData: TokamakL2TxData, opts: TxOptions)` - Create unsigned L2 transaction
- `createTokamakL2TxFromRLP(rlpBytes, opts)` - Create transaction from RLP-encoded bytes
- `TokamakL2Tx` - Transaction class
- `TokamakL2TxData` - Transaction data type

### Cryptography
- `getEddsaPublicKey(...)` - Get EdDSA public key
- `poseidon(...)` - Poseidon hash function

### State Management
- `StateSnapshot` - State snapshot type
- `createTokamakL2StateManagerFromL1RPC(...)` - Create state manager from L1 RPC
- `createTokamakL2StateManagerFromStateSnapshot(...)` - Create state manager from snapshot

### Constants
- `L2_PRV_KEY_MESSAGE` - Message prefix for L2 private key derivation

## Migration from Submodule to Package

### Before (Submodule)
```typescript
import { deriveL2KeysFromSignature } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/utils/web";
import { getEddsaPublicKey, poseidon } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/crypto";
import { TokamakL2Tx } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/tx/TokamakL2Tx";
import { createTokamakL2Tx } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/TokamakL2JS/tx/constructors";
```

### After (Package)
```typescript
import {
  deriveL2KeysFromSignature,
  getEddsaPublicKey,
  poseidon,
  TokamakL2Tx,
  createTokamakL2Tx,
} from "tokamak-l2js";
```

## Example: Creating ERC20 Transfer Transaction

```typescript
import {
  createTokamakL2Tx,
  getEddsaPublicKey,
  poseidon,
  TokamakL2Tx,
  TokamakL2TxData,
} from "tokamak-l2js";
import { Common, Mainnet } from "@ethereumjs/common";
import { deriveL2KeysAndAddressFromSignature } from "@/lib/tokamakl2js";
import { ERC20_TRANSFER } from "@tokamak/config";

// Create common with custom crypto
const common = new Common({
  chain: { ...Mainnet },
  customCrypto: { keccak256: poseidon, ecrecover: getEddsaPublicKey },
});

// Derive L2 account
const account = deriveL2KeysAndAddressFromSignature(keySeed, ERC20_TRANSFER[tokenAddress].slot);

// Create transaction
const txData: TokamakL2TxData = {
  nonce: BigInt(0),
  to: createAddressFromString(tokenAddress),
  data: calldata,
  senderPubKey: hexToBytes(account.publicKey),
};

const unsignedTx = createTokamakL2Tx(txData, { common });
const signedTx = unsignedTx.sign(hexToBytes(addHexPrefix(account.privateKey)));
```

## Why This Change?

1. **Consistency**: The submodule code has been migrated to an npm package (`tokamak-l2js`)
2. **Build Compatibility**: Direct submodule imports can cause webpack/build issues
3. **Maintainability**: Using a published package makes versioning and updates easier
4. **Type Safety**: The package provides proper TypeScript types

## Files Using `tokamak-l2js`

- `lib/tokamakl2js.ts` - MPT key generation utilities
- `lib/createERC20TransferTx.ts` - ERC20 transfer transaction creation
- `lib/l2KeyMessage.ts` - L2 private key message constant
- `app/api/tokamak-zk-evm/route.ts` - Synthesizer API route

## Troubleshooting

### Build Error: Module not found

If you see errors like:
```
Module not found: Can't resolve '@/Tokamak-Zk-EVM/packages/frontend/synthesizer/...'
```

**Solution**: Replace the submodule import with `tokamak-l2js` package import.

### Type Errors

If TypeScript complains about missing types:
1. Ensure `tokamak-l2js` is installed: `npm install tokamak-l2js`
2. Check that you're importing from `"tokamak-l2js"` not the submodule
3. Restart your TypeScript server

## References

- Package: `tokamak-l2js` (npm)
- Version: Check `package.json` for current version
- Submodule: `Tokamak-Zk-EVM` (git submodule, dev branch)

---

**Last Updated**: 2026-01-11
**Status**: Active - All new code must use `tokamak-l2js` package
