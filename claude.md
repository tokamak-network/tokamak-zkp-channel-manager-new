# CLAUDE.md

This file provides guidance for AI assistants working with the Tokamak Private App Channels Manager codebase.

## Project Overview

**Tokamak Private App Channels** is a Layer 2 state channel solution with zero-knowledge proof verification on Ethereum. It enables:

- **Off-chain ERC20 transactions** - Execute token transfers without on-chain gas costs
- **ZK proof verification** - Cryptographically prove transaction validity
- **Trustless settlement** - Final balances verified and settled on-chain

The core principle: "Don't Trust. Verify." - Channel leaders and participants are equally bound by proof verification.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 (App Router) | Web framework |
| TypeScript 5.7 | Language |
| React 19 | UI library |
| Wagmi + Viem | Blockchain interaction |
| Zustand | State management |
| snarkjs | Groth16 proof generation (browser) |
| Tokamak-Zk-EVM | L2 transaction synthesis & proof generation |
| Tailwind CSS | Styling |

## Channel Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHANNEL LIFECYCLE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE CHANNEL ──────► openChannel()
   │                      - Leader specifies participants (2-128)
   │                      - Channel ID generated (bytes32)
   │
   ▼ State: Initialized (1)
   
2. DEPOSIT ─────────────► depositToken()
   │                      - Each participant deposits tokens
   │                      - Registers MPT Key (L2 address)
   │                      - 0 TON deposit allowed (for key registration only)
   │
   ▼ State: Initialized (1)
   
3. INITIALIZE STATE ────► initializeChannelState()
   │                      - Leader only
   │                      - Generates Groth16 proof (snarkjs, browser-side)
   │                      - Creates initial Merkle tree of balances
   │
   ▼ State: Open (2)
   
4. L2 TRANSACTIONS ─────► Tokamak-Zk-EVM synthesizer
   │                      - Off-chain ERC20 transfers
   │                      - Each transaction generates ZK proof
   │                      - Proofs stored in local DB
   │
   ▼ State: Open (2)
   
5. SUBMIT PROOF ────────► submitProofAndSignature()
   │                      - Leader submits approved proofs on-chain
   │                      - Updates channel state root
   │
   ▼ State: Closing (3)
   
6. CLOSE CHANNEL ───────► verifyFinalBalancesGroth16()
   │                      - Verifies final balance distribution
   │                      - Generates closing Groth16 proof
   │
   ▼ State: Closed (4)
   
7. WITHDRAW ────────────► withdraw()
                          - Each participant withdraws their final balance
```

## Channel State Enum

The smart contract defines channel states as:

```solidity
enum ChannelState {
    None,        // 0 - Channel doesn't exist
    Initialized, // 1 - Created, awaiting deposits & initialization
    Open,        // 2 - Active, can execute L2 transactions
    Closing,     // 3 - Proof submitted, awaiting final verification
    Closed       // 4 - Finalized, ready for withdrawals
}
```

**UI Page Mapping:**

| State | Value | UI Page | Leader Actions |
|-------|-------|---------|----------------|
| None | 0 | state0 (edge case) | - |
| Initialized | 1 | `/state-explorer/deposit` | Initialize State |
| Open | 2 | `/state-explorer/transaction` | Submit Proof |
| Closing | 3 | `/state-explorer/state3` | Close Channel |
| Closed | 4 | `/state-explorer/withdraw` | - |

## Proof Generation

### A. Initialize State Proof (snarkjs - Browser)

Used when initializing channel state after deposits.

**Files:**
- `lib/clientProofGeneration.ts` - Main proof generation logic
- `app/state-explorer/_hooks/useGenerateInitialProof.ts` - React hook
- `public/zk-assets/wasm/` - Circuit WASM files
- `public/zk-assets/zkey/` - Proving keys

**Tree Sizes:** 16, 32, 64, 128 leaves (selected based on participant count)

**Flow:**
1. Collect MPT keys and deposits from contract
2. Build Merkle tree input
3. Generate Groth16 proof in browser
4. Submit proof with `initializeChannelState()`

### B. Transaction Proof (Tokamak-Zk-EVM - Server)

Used for L2 ERC20 transfer transactions.

**Files:**
- `app/api/tokamak-zk-evm/route.ts` - API endpoint
- `app/state-explorer/_hooks/useSynthesizer.ts` - React hook
- `Tokamak-Zk-EVM/` - Submodule with CLI tools

**CLI Commands (tokamak-cli):**
```bash
--synthesize    # Execute L2 transaction, generate execution trace
--prove         # Generate ZK proof from trace
--verify        # Verify proof validity (must pass before extraction)
--extract-proof # Package proof into ZIP file
```

**Flow:**
1. User signs L2 transaction (ERC20 transfer)
2. API calls `tokamak-cli --synthesize` with transaction data
3. If `includeProof=true`:
   - Run `--prove` to generate proof
   - Run `--preprocess` + `--verify` to validate
   - Only if verification passes: `--extract-proof`
4. Return ZIP file with proof and state snapshot

## Key Directories

```
tokamak-zkp-channel-manager-new/
├── app/
│   ├── (home)/                    # Landing page
│   ├── create-channel/            # Channel creation flow
│   ├── join-channel/              # Join existing channel
│   ├── state-explorer/            # Main channel management
│   │   ├── deposit/               # Token deposit UI
│   │   ├── transaction/           # L2 transactions & proof list
│   │   ├── state3/                # Channel closing (Closing state)
│   │   └── withdraw/              # Token withdrawal UI
│   └── api/
│       ├── tokamak-zk-evm/        # L2 synthesis & proof API
│       ├── channels/              # Channel CRUD API
│       ├── save-proof-zip/        # Store proof files
│       └── get-proof-zip/         # Retrieve proof files
│
├── hooks/
│   ├── contract/                  # Smart contract interaction hooks
│   │   ├── useBridgeCore.ts       # Channel state, participants
│   │   ├── useBridgeDepositManager.ts
│   │   ├── useBridgeProofManager.ts
│   │   └── useBridgeWithdrawManager.ts
│   ├── useChannelInfo.ts          # Channel data aggregation
│   ├── useGenerateMptKey.ts       # L2 address generation
│   └── useTokenBalance.ts         # ERC20 balance queries
│
├── lib/
│   ├── clientProofGeneration.ts   # Browser Groth16 proof
│   ├── createERC20TransferTx.ts   # L2 transaction signing
│   ├── db/                        # Local file-based DB
│   │   ├── channels.ts            # Channel operations
│   │   └── helpers.ts             # File system utilities
│   └── ethers.ts                  # RPC utilities
│
├── packages/
│   ├── config/                    # Network & contract configuration
│   │   └── src/constants.ts       # Contract addresses, network config
│   ├── frost/                     # FROST signature (not yet used)
│   └── ui/                        # Shared UI components
│
├── stores/                        # Zustand state stores
│   ├── useChannelFlowStore.ts     # Current channel context
│   ├── useDepositStore.ts         # Deposit form state
│   └── useInitializeStore.ts      # Initialization state
│
├── Tokamak-Zk-EVM/                # Git submodule
│   └── tokamak-cli                # CLI for synthesis/proving
│
└── public/zk-assets/              # ZK circuit files
    ├── wasm/                      # Circuit WASM (N4, N5, N6, N7)
    └── zkey/                      # Proving keys (16, 32 leaves)
```

## Smart Contracts

All contracts are deployed on **Sepolia Testnet**.

| Contract | Address | Purpose |
|----------|---------|---------|
| BridgeCore | See `packages/config` | Channel creation, state management, participant tracking |
| BridgeDepositManager | See `packages/config` | Token deposits, MPT key registration |
| BridgeProofManager | See `packages/config` | Proof submission, state initialization |
| BridgeWithdrawManager | See `packages/config` | Token withdrawals after channel closure |

**Key Contract Functions:**

```typescript
// BridgeCore
openChannel(participants, targetContract)     // Create channel
getChannelState(channelId)                    // Get current state
getChannelParticipants(channelId)             // Get participant list
getChannelLeader(channelId)                   // Get leader address
getL2MptKey(channelId, participant)           // Get L2 address
getParticipantDeposit(channelId, participant) // Get deposit amount

// BridgeDepositManager
depositToken(channelId, amount, mptKey)       // Deposit with L2 key

// BridgeProofManager
initializeChannelState(channelId, proof)      // Initialize with Groth16
submitProofAndSignature(channelId, proofs, signature)

// BridgeWithdrawManager
withdraw(channelId, token)                    // Withdraw final balance
getWithdrawableAmount(channelId, user, token) // Check withdrawable
```

## Local Database Structure

Proofs and channel metadata are stored in `data/uploads/channels/`:

```
data/uploads/channels/
└── {channelId}/                   # Normalized to lowercase
    ├── channel.json               # Channel metadata
    └── proofs/
        ├── {proofKey}/            # e.g., "0x...-proof#1-0"
        │   ├── proof.json
        │   ├── instance.json
        │   ├── state_snapshot.json
        │   └── ...
        ├── submittedProofs/       # Pending review
        ├── verifiedProofs/        # Approved by leader
        └── rejectedProofs/        # Rejected proofs
```

**Proof Status Flow:**
1. Generated → saved to `proofs/{proofKey}/`
2. Submitted → moved to `submittedProofs/`
3. Approved by leader → moved to `verifiedProofs/`
4. Rejected → moved to `rejectedProofs/`

## DKG/FROST Status

The `packages/frost/` directory contains FROST (Flexible Round-Optimized Schnorr Threshold) signature implementation. **Currently not in use** - the multi-signature verification feature is planned for future implementation.

## Development Setup

### Prerequisites
- Node.js 18+
- Alchemy API Key (Sepolia)
- MetaMask or Web3 wallet

### Quick Start
```bash
npm install          # Prompts for RPC URL
npm run dev          # Start dev server at localhost:3000
```

### Environment Variables
```bash
RPC_URL='https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
NEXT_PUBLIC_ALCHEMY_API_KEY='YOUR_KEY'
```

### Key Configuration
- Network config: `packages/config/src/constants.ts`
- Contract addresses: `packages/config/src/contracts/addresses.ts`
- Contract ABIs: `packages/config/src/contracts/abis.ts`

## Common Patterns

### Contract Hook Usage
```typescript
import { useBridgeCoreRead } from "@/hooks/contract";

const { data, isLoading } = useBridgeCoreRead({
  functionName: "getChannelState",
  args: [channelId],
  query: { enabled: !!channelId },
});
```

### Channel ID Format
- Stored as `bytes32` in contract
- Displayed truncated: `0x1234...5678`
- Normalized to lowercase in DB operations

### Participant Check
```typescript
// State < 2: Use isChannelWhitelisted
// State >= 2: Use getChannelParticipants
```

## Important Notes

1. **Leader vs Participant**: Only the channel leader (first participant) can:
   - Initialize channel state
   - Approve/reject proofs
   - Submit proofs on-chain
   - Close the channel

2. **Proof Verification**: Transaction proofs must pass `--verify` before being extractable. Invalid proofs are rejected.

3. **MPT Key**: Each participant's L2 address. Can deposit 0 TON just to register the key.

4. **State Transitions**: One-way only (None → Initialized → Open → Closing → Closed)

5. **Tree Size**: Automatically selected based on `participantCount + preAllocatedLeaves`
