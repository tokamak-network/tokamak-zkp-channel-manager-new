# CLAUDE.md

This file provides guidance to Claude Code when working with the frost package.

## Package Overview

This is the **FROST package** - an optional plugin providing Distributed Key Generation (DKG) and threshold signing using the FROST protocol.

### Key Principles

- Optional dependency - app works without it
- WASM-based for cryptographic operations
- Clean API hiding WASM complexity
- Type-safe interfaces

## Directory Structure

```
packages/frost/
├── src/
│   ├── types.ts      # Type definitions
│   ├── dkg.ts        # DKG operations
│   ├── signing.ts    # Threshold signing
│   └── index.ts      # Public exports
├── wasm/             # WASM binaries (gitignored, built from external)
├── package.json
└── CLAUDE.md
```

## Usage

```ts
// Import
import { createFrostDKG, createFrostSigning } from '@tokamak/frost';
import type { DKGSession, ThresholdSignature } from '@tokamak/frost';

// DKG
const dkg = createFrostDKG({ wasmPath: '/wasm/frost.wasm' });
await dkg.init();

const session = await dkg.startSession(channelId, participants, threshold);
const round1 = await dkg.generateRound1();
// ... exchange with other participants
const result = await dkg.finalize(allRound2Data);

// Signing
const signing = createFrostSigning();
await signing.init();

const commitment = await signing.generateCommitment(sessionId);
const share = await signing.generateSignatureShare(sessionId, allCommitments);
const signature = await signing.aggregateSignature(allShares);
```

## WASM Integration

### Building WASM

WASM binaries are built from the `external/frost-dkg` subtree:

```bash
# From project root
pnpm frost build:wasm
```

### Loading WASM

```ts
// In browser
const dkg = createFrostDKG({
  wasmPath: '/wasm/frost_dkg.wasm',
});

// In Node.js (if supported)
const dkg = createFrostDKG({
  wasmPath: path.join(__dirname, 'wasm/frost_dkg.wasm'),
});
```

## DKG Flow

```
1. startSession()      - Initialize session with participants
2. generateRound1()    - Create commitment + proof of knowledge
3. processRound1()     - Verify other participants' Round 1 data
4. generateRound2()    - Create encrypted key shares
5. finalize()          - Process Round 2, derive group public key
6. getKeyShare()       - Get participant's encrypted key share
```

## Signing Flow

```
1. startSession()           - Initialize with message + participants
2. generateCommitment()     - Round 1: Create nonce commitment
3. generateSignatureShare() - Round 2: Create partial signature
4. aggregateSignature()     - Combine shares into full signature
5. verifySignature()        - Verify against group public key
```

## Error Handling

```ts
try {
  await dkg.init();
} catch (error) {
  if (error instanceof WasmLoadError) {
    // WASM failed to load
  }
}

try {
  await dkg.finalize(data);
} catch (error) {
  if (error instanceof DKGError) {
    // DKG protocol error
  }
}
```

## Testing

### Mock Mode

For testing without WASM:

```ts
const dkg = createFrostDKG({ mock: true });
// Returns mock data without loading WASM
```

### Unit Tests

```ts
describe('FrostDKG', () => {
  it('initializes correctly', async () => {
    const dkg = createFrostDKG({ mock: true });
    await dkg.init();
    expect(dkg.isInitialized()).toBe(true);
  });
});
```

## Do's and Don'ts

### ✅ Do's

- Always call `init()` before other operations
- Handle WASM loading errors gracefully
- Use TypeScript types for session data
- Clean up sessions when done

### ❌ Don'ts

- Don't expose WASM internals
- Don't store unencrypted key shares
- Don't skip initialization check
- Don't assume WASM is always available

