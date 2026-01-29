# Tokamak ZKP Channel Manager

A web application for managing Tokamak Private App Channels - secure Layer 2 state channels with zero-knowledge proof verification on Ethereum.

## Overview

Tokamak ZKP Channel Manager enables users to:
- **Create Channels** - Initialize state channels with multiple participants
- **Deposit Tokens** - Deposit ERC20 tokens (TON) into channels
- **Execute L2 Transactions** - Perform off-chain transactions within channels
- **Generate ZK Proofs** - Create Groth16 proofs for transaction verification
- **Submit Proofs** - Submit proofs on-chain for state updates
- **Withdraw Funds** - Withdraw tokens after channel closure

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **React**: React 19
- **Blockchain**: Wagmi + Viem
- **State Management**: Zustand
- **ZK Proofs**: snarkjs (Groth16)

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- MetaMask or other Web3 wallet
- Alchemy API Key (required)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/tokamak-network/tokamak-zkp-channel-manager-new.git
cd tokamak-zkp-channel-manager-new
```

2. **Install dependencies**

```bash
npm install
```

During installation, you will be prompted to enter your RPC URL.

> **Skip Setup**: If Tokamak-Zk-EVM submodule is already properly configured (correct branch with built binaries), you can skip the setup:
> ```bash
> SKIP_SUBMODULE_SETUP=1 npm install
> ```

Setup prompt:

```
============================================
Tokamak ZKP Channel Manager Setup
============================================

RPC URL is required for the manager app and synthesizer.
Example: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

Enter RPC URL (https://...) or press Enter to skip:
```

> **Important**: Enter your Alchemy Sepolia RPC URL. This is required for the app to function properly.

3. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Manual Setup (if skipped during install)

If you skipped the RPC URL prompt during installation:

1. Create `.env` file in project root:

```bash
echo "RPC_URL='https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'" > .env
echo "NEXT_PUBLIC_ALCHEMY_API_KEY='YOUR_API_KEY'" >> .env
```

2. Run tokamak-cli:

```bash
cd Tokamak-Zk-EVM
./tokamak-cli --install https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY --bun
cd ..
```

### Submodule Setup Options

| Command | Description |
|---------|-------------|
| `npm install` | Interactive setup (prompts if existing installation detected) |
| `SKIP_SUBMODULE_SETUP=1 npm install` | Skip all submodule setup |
| `SKIP_TOKAMAK_CLI=1 npm install` | Skip only tokamak-cli installation |
| `npm run setup` | Run setup manually |
| `npm run setup:force` | Force re-run setup (ignore existing installation) |

**Environment Variables:**
- `SKIP_SUBMODULE_SETUP=1` - Skip entire submodule setup process
- `SKIP_TOKAMAK_CLI=1` - Skip only tokamak-cli installation step
- `CI=true` - Non-interactive mode (auto-skip if existing installation detected)

## Project Structure

```
tokamak-zkp-channel-manager-new/
├── app/                          # Next.js App Router
│   ├── (home)/                   # Home page
│   ├── create-channel/           # Channel creation flow
│   ├── join-channel/             # Join existing channel
│   ├── initialize-state/         # Initialize channel state
│   ├── state-explorer/           # Channel state management
│   │   ├── deposit/              # Token deposit
│   │   ├── transaction/          # L2 transactions & proofs
│   │   ├── state3/               # Channel closing
│   │   └── withdraw/             # Token withdrawal
│   ├── l2-address/               # L2 address calculator
│   └── api/                      # API routes
├── components/                   # Shared UI components
├── hooks/                        # Custom React hooks
│   └── contract/                 # Contract interaction hooks
├── lib/                          # Utility functions
│   └── db/                       # Database utilities
├── packages/                     # Internal packages
│   ├── config/                   # Network & contract config
│   ├── frost/                    # FROST signature utilities
│   └── ui/                       # Shared UI components
├── stores/                       # Zustand state stores
├── public/zk-assets/             # ZK circuit files (wasm, zkey)
├── Tokamak-Zk-EVM/               # ZK-EVM submodule
└── docs/                         # Documentation
```

## Available Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript type checking

# Setup
npm run setup         # Re-run submodule setup

# Testing
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
```

## Network Configuration

| Property | Value |
|----------|-------|
| Network | Sepolia Testnet |
| Chain ID | 11155111 |

### Getting Test Tokens

**Sepolia ETH Faucets:**
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- [PoW Mining Faucet](https://sepolia-faucet.pk910.de/)

**TON Faucet:**
- [TON Faucet Contract](https://sepolia.etherscan.io/address/0xd655762c601b9cac8f6644c4841e47e4734d0444#writeContract#F1) - Execute `requestTokens` function

## Documentation

- [Internal Test Guide](./docs/INTERNAL_TEST_GUIDE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Migration Guide](./docs/MIGRATION_GUIDE.md)
- [Contract Hooks Usage](./docs/development/CONTRACT_HOOKS_USAGE.md)

## Channel Flow

```
1. Create Channel    → Channel initialized with participants
2. Deposit          → Participants deposit tokens (State: Initialized)
3. Initialize State → Leader initializes channel state (State: Open)
4. Transactions     → Off-chain L2 transactions with ZK proofs
5. Submit Proof     → Leader submits proof on-chain (State: Closing)
6. Close Channel    → Verify final balances (State: Closed)
7. Withdraw         → Participants withdraw their funds
```

## License

MIT
