# CLAUDE.md

This file provides guidance to Claude Code when working with the config package.

## Package Overview

This is the **Config package** - centralized configuration for the Tokamak ZKP Channel Manager. Contains constants, network settings, and environment configuration.

### Key Principles

- No runtime dependencies (pure TypeScript)
- Type-safe configuration
- Single source of truth for constants
- Environment-agnostic defaults

## Directory Structure

```
packages/config/
├── src/
│   ├── constants.ts    # App constants, status enums
│   ├── networks.ts     # Network configs, contract addresses
│   ├── env.ts          # Environment variable handling
│   └── index.ts        # Public exports
├── package.json
└── CLAUDE.md
```

## Usage

```ts
// Import everything
import { CHANNEL_STATUS, NETWORKS, getContractAddress } from '@tokamak/config';

// Import specific modules
import { NETWORKS, DEFAULT_NETWORK } from '@tokamak/config/networks';
import { CHANNEL_STATUS, DKG_STATUS } from '@tokamak/config/constants';
```

## Adding New Constants

1. Determine the appropriate file (`constants.ts`, `networks.ts`, etc.)
2. Add with `as const` for type inference
3. Export type if needed
4. Update `index.ts` if new file created

```ts
// Example: Adding a new constant
export const NEW_CONSTANT = {
  VALUE_A: 'a',
  VALUE_B: 'b',
} as const;

export type NewConstantType = (typeof NEW_CONSTANT)[keyof typeof NEW_CONSTANT];
```

## Adding New Network

```ts
// In networks.ts
export const NETWORKS = {
  // ... existing
  newNetwork: {
    id: 12345,
    name: 'New Network',
    rpcUrl: 'https://...',
    blockExplorer: 'https://...',
    isTestnet: true,
  },
} as const;

// Update CONTRACT_ADDRESSES
export const CONTRACT_ADDRESSES = {
  // ... existing
  newNetwork: {
    rollupBridge: '0x...',
    // ...
  },
} as const;
```

## Do's and Don'ts

### ✅ Do's

- Use `as const` for literal types
- Export types alongside constants
- Keep related constants grouped
- Document with JSDoc comments

### ❌ Don'ts

- Don't add runtime dependencies
- Don't import from other packages (except types)
- Don't hardcode sensitive values
- Don't add React-specific code
