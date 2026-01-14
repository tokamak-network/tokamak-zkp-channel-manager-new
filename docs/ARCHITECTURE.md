# Architecture Analysis - Legacy Repository

## 📊 Current State Analysis

This document analyzes the existing `Tokamak-zkp-channel-manager` repository to inform migration decisions.

---

## 🏛️ Legacy Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (Next.js 15)
┌─────────────────────────────────────────────────────────────────────────────┐
│  app/                    components/              lib/                       │
│  ├── api/ (22 routes)    ├── dkg/ (16)           ├── contracts.ts           │
│  ├── channels/           ├── ui/ (16)            ├── frost-wasm.ts          │
│  ├── create-channel/     ├── ChannelCard.tsx     ├── types.ts               │
│  ├── deposit-tokens/     ├── DepositModal.tsx    ├── utils.ts               │
│  └── ...                 └── ...                 └── wasm/pkg/              │
│                                                                              │
│  hooks/                  contexts/                                          │
│  ├── useChannelData.ts   └── ThemeContext.tsx                               │
│  ├── useDKGWebSocket.ts                                                     │
│  └── ...                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐
│   SMART CONTRACTS     │ │   DKG SERVER    │ │      ZK-EVM ENGINE          │
│   (Submodule)         │ │   (Submodule)   │ │      (Submodule)            │
├───────────────────────┤ ├─────────────────┤ ├─────────────────────────────┤
│  contracts/           │ │  frost-dkg/     │ │  Tokamak-Zk-EVM/            │
│  ├── src/*.sol        │ │  ├── fserver/   │ │  ├── src/ (circom)         │
│  └── lib/ (deps)      │ │  ├── wasm/      │ │  └── qap-compiler/         │
│                       │ │  └── ...        │ │                             │
│  → NOT USED DIRECTLY  │ │  → WASM pkg     │ │  → Circuit compilation     │
│    (fetch ABIs)       │ │    used only    │ │                             │
└───────────────────────┘ └─────────────────┘ └─────────────────────────────┘
```

---

## 📁 Directory Analysis

### `/app` - Next.js App Router

**Pages (12):**
| Page | Purpose | Complexity |
|------|---------|------------|
| `page.tsx` | Home/Dashboard | Medium |
| `channels/` | Channel list | Low |
| `create-channel/` | Create new channel | High |
| `deposit-tokens/` | Token deposits | Medium |
| `withdraw-tokens/` | Token withdrawals | Medium |
| `initialize-state/` | State initialization | High |
| `submit-proof/` | Proof submission | High |
| `unfreeze-state/` | State unfreeze | High |
| `state-explorer/` | State browser | High |
| `dkg-management/` | DKG ceremony | Very High |
| `threshold-signing/` | Threshold signatures | High |
| `dashboard/` | User dashboard | Medium |

**API Routes (22):**
| Category | Routes | Notes |
|----------|--------|-------|
| ZK Proofs | `generate-groth16-proof`, `verify-proof-binary`, `get-initial-proof`, `tokamak-zk-evm` | Core ZK functionality (verify-proof merged into tokamak-zk-evm) |
| Channel State | `get-contract-state-for-proof`, `get-channel-deposits-with-keys`, `get-participant-deposit`, `simulate-contract-public-signals` | Contract interactions |
| Proof Files | `save-proof-zip`, `save-proof-file`, `get-proof-zip`, `delete-proof`, `get-next-proof-number` | File management |
| DKG | `frost-dkg` | WebSocket proxy |
| Database | `db`, `firebase/*` | Data persistence |
| Utilities | `proxy-zkey`, `proxy-large-zkey`, `get-l2-mpt-key`, `get-pre-allocated-leaf`, `test-contract-functions`, `create-l2-signed-transaction` | Various utilities |

---

### `/components` - React Components

**DKG Components (16):**

```
components/dkg/
├── DKGAutomatedCeremonyModal.tsx    # Automated DKG flow
├── DKGAutomationStatus.tsx          # Status display
├── DKGCommitmentModal.tsx           # Commitment handling
├── DKGConnectionStatus.tsx          # Connection indicator
├── DKGErrorDisplay.tsx              # Error handling
├── DKGQuickStart.tsx                # Quick start guide
├── DKGServerDeploymentGuide.tsx     # Server setup guide
├── DKGSessionCreator.tsx            # Session creation
├── DKGSessionDetails.tsx            # Session details
├── DKGSessionDetailsModal.tsx       # Details modal
├── DKGSessionGrid.tsx               # Grid layout
├── DKGSessionInfo.tsx               # Info display
├── DKGSessionJoiner.tsx             # Join session
├── DKGSessionsList.tsx              # Sessions list
├── DKGWasmStatus.tsx                # WASM status
└── UIDManagement.tsx                # User ID management
```

**UI Components (16):**

```
components/ui/
├── badge.tsx              # Status badges
├── button.tsx             # Button component
├── card.tsx               # Card container
├── copy-button.tsx        # Copy to clipboard
├── dialog.tsx             # Modal dialogs
├── error-boundary.tsx     # Error handling
├── input.tsx              # Input fields
├── label.tsx              # Form labels
├── loading-spinner.tsx    # Loading states
├── progress.tsx           # Progress bars
├── retry-button.tsx       # Retry actions
├── select.tsx             # Select dropdowns
├── status-indicator.tsx   # Status indicators
├── textarea.tsx           # Text areas
├── theme-toggle.tsx       # Dark/light mode
└── toast.tsx              # Notifications
```

**Feature Components:**

```
components/
├── ChannelCard.tsx              # Channel display card
├── ChannelCreatedBanner.tsx     # Success banner
├── ClientOnly.tsx               # SSR wrapper
├── ContractInfo.tsx             # Contract display
├── CreateChannelModal.tsx       # Create channel form
├── DarkModeToggle.tsx           # Theme toggle
├── DepositModal.tsx             # Deposit form
├── EmergencyWithdrawal.tsx      # Emergency actions
├── Footer.tsx                   # Page footer
├── Header.tsx                   # Page header
├── L2MPTKeyBanner.tsx           # L2 key display
├── Layout.tsx                   # Page layout
├── LoadingSpinner.tsx           # Loading state
├── MobileMenuButton.tsx         # Mobile nav
├── MobileNavigation.tsx         # Mobile menu
├── NetworkDropdown.tsx          # Network selector
├── ProofCard.tsx                # Proof display
├── ProofSubmissionModal.tsx     # Proof form
├── Sidebar.tsx                  # Side navigation
├── SigningSessionModal.tsx      # Signing UI
├── StatusBadge.tsx              # Status display
├── SubmitProofModal.tsx         # Submit form
├── TestPage.tsx                 # Test component
└── TransactionBundleModal.tsx   # Transaction batching
```

---

### `/lib` - Core Libraries

**Contract Integration:**

```typescript
// lib/contracts.ts - Contract utilities
export const ROLLUP_BRIDGE_CORE_ADDRESS
export const ROLLUP_BRIDGE_ABI
export function getGroth16VerifierAddress(treeSize: number)

// Dependencies:
// - lib/bridge-contract-address.json (generated)
// - lib/bridge-contract-abi.ts (generated)
```

**FROST WASM:**

```typescript
// lib/frost-wasm.ts - WASM wrapper
export async function initWasm()
export function generateKeypair()
export function dkgRound1/2/Finalize()
export function encryptShare/decryptShare()
export function signRound1Commit/signRound2Sign()

// Dependencies:
// - lib/wasm/pkg/tokamak_frost_wasm.js
// - lib/wasm/pkg/tokamak_frost_wasm.wasm
```

**Types:**

```typescript
// lib/types.ts - Core types
export enum ChannelState
export interface ChannelParams
export interface ProofData
export interface Signature
export interface ExtendedChannelData
export interface NetworkConfig
```

---

### `/hooks` - Custom React Hooks

| Hook                      | Purpose               | Dependencies     |
| ------------------------- | --------------------- | ---------------- |
| `useChannelData.ts`       | Channel data fetching | wagmi, contracts |
| `useChannelLeadership.ts` | Leadership checks     | wagmi, contracts |
| `useDKGWebSocket.ts`      | DKG WebSocket         | frost-wasm       |
| `useDKGRounds.ts`         | DKG round management  | frost-wasm       |
| `useAutomatedDKG.ts`      | Automated DKG flow    | useDKGWebSocket  |
| `useLeaderAccess.ts`      | Access control        | wagmi            |
| `useUserRolesDynamic.ts`  | User role detection   | wagmi, contracts |

---

## 🔗 Dependency Analysis

### External Package Dependencies

```json
{
  "dependencies": {
    // Ethereum
    "@rainbow-me/rainbowkit": "^1.3.1",
    "@wagmi/core": "^1.4.13",
    "wagmi": "^1.4.13",
    "viem": "^1.21.4",
    "ethers": "^6.14.3",

    // ZK
    "snarkjs": "^0.7.5",
    "@zk-kit/imt": "^2.0.0-beta.8",

    // Cryptography
    "@noble/curves": "^1.9.0",
    "elliptic": "^6.6.1",
    "ethereum-cryptography": "^3.2.0",
    "crypto-js": "^4.2.0",

    // UI
    "@radix-ui/*": "Various",
    "lucide-react": "^0.292.0",
    "tailwind-merge": "^2.0.0",
    "clsx": "^2.0.0",

    // Framework
    "next": "^15.5.7",
    "react": "^18",
    "react-dom": "^18"
  }
}
```

### Internal Dependencies (Submodules)

| Submodule         | Actual Usage                            |
| ----------------- | --------------------------------------- |
| `contracts/`      | **NOT USED** - ABIs fetched from GitHub |
| `frost-dkg/`      | Only `wasm/pkg/` used (pre-built)       |
| `Tokamak-Zk-EVM/` | Only for circuit files, rarely rebuilt  |

---

## 🎯 Migration Priorities

### High Priority (Core Functionality)

1. **Contract Integration** (`packages/contracts`)

   - Move ABI fetch script
   - Create type-safe contract hooks
   - Export addresses per network

2. **FROST WASM** (`packages/frost-wasm`)

   - Copy pre-built WASM pkg
   - Move TypeScript wrappers
   - Create clean API

3. **Core Types** (`packages/lib`)
   - Move shared types
   - Move utility functions
   - Create custom hooks package

### Medium Priority (UI/UX)

4. **UI Components** (`packages/ui`)

   - Move shadcn/ui components
   - Setup Tailwind config
   - Create component exports

5. **App Pages** (`apps/web`)
   - Migrate page components
   - Update imports
   - Test functionality

### Lower Priority (Infrastructure)

6. **API Routes** (`apps/web/app/api`)

   - Review which are still needed
   - Consider serverless functions
   - Remove deprecated routes

7. **External Dependencies** (`external/`)
   - Add as git subtrees
   - Create rebuild scripts
   - Document update process

---

## ⚠️ Technical Debt to Address

1. **Firebase Dependency** - Currently used for real-time data, being phased out
2. **Mixed State Management** - Contract, local DB, and Firebase state scattered
3. **Large Components** - Some components (TransactionBundleModal: 902 lines) need splitting
4. **Duplicate Code** - Similar patterns repeated across pages
5. **API Route Proliferation** - 22 routes, some may be obsolete

---

## 📊 Size Estimates

| Directory   | Files    | Lines (approx) |
| ----------- | -------- | -------------- |
| app/        | 35+      | 15,000+        |
| components/ | 45+      | 8,000+         |
| lib/        | 20+      | 5,000+         |
| hooks/      | 7        | 1,500+         |
| **Total**   | **107+** | **30,000+**    |

---

## 🔄 What NOT to Migrate

1. **Solidity Source Code** (`contracts/src/`)
   - Use fetch script for deployed ABIs
2. **Full frost-dkg Repository**
   - Only copy `wasm/pkg/` directory
3. **Full Tokamak-Zk-EVM Repository**
   - Keep as external subtree for circuit compilation only
4. **Deprecated Files**
   - `page-simple.tsx`, `page-step1.tsx`, `page-step2.tsx`
   - Old backup files (`page-original-backup.tsx`)
5. **Generated Files**
   - `bridge-contract-abi.ts` (regenerate)
   - `bridge-contract-address.json` (regenerate)
