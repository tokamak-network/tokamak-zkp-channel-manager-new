# 🧪 Tokamak ZKP Channel Manager - Internal Test Guide

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Installation](#installation)
3. [Running & Testing](#running--testing)
4. [Channel Flow](#channel-flow)
5. [Feedback](#feedback)

---

## 🛠️ Environment Setup

### Requirements

- **Node.js**: v18 or higher
- **Git**: Latest version
- **Wallet**: MetaMask or other Web3 wallet (Sepolia Testnet)
- **Sepolia ETH**: Test ETH required
- **Test TON**: Get from TON Faucet

### Testnet Information

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111

### Faucet Links

**Sepolia ETH Faucet** (No mainnet balance required):

- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) - Only Google account needed
- [Chainlink Faucet](https://faucets.chain.link/sepolia) - Simple verification required
- [PoW Mining Faucet](https://sepolia-faucet.pk910.de/) - Mine in browser

**TON Faucet** (Test TON tokens):

- [TON Faucet Contract](https://sepolia.etherscan.io/address/0xd655762c601b9cac8f6644c4841e47e4734d0444#writeContract#F1) - Execute `requestTokens` function

---

## 📦 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/tokamak-network/tokamak-zkp-channel-manager-new.git
cd tokamak-zkp-channel-manager-new
```

### Step 2: Install Dependencies

```bash
npm install
```

> 💡 `npm install` automatically sets up the submodule (Tokamak-Zk-EVM).

### Console Output Example

```
npm install

> tokamak-zkp-channel-manager@0.1.0 postinstall
> bash scripts/setup-submodules.sh

Setting up git submodules...
Submodule Tokamak-Zk-EVM already exists. Updating to latest dev-manager...
Submodule path 'Tokamak-Zk-EVM': checked out 'abc1234...'
Checking out dev-manager branch...
Git submodules setup complete!

============================================
Tokamak-Zk-EVM Setup
============================================

RPC URL is required for synthesizer.
Example: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

Enter RPC URL (https://...) or press Enter to skip: 
```

### Step 3: RPC URL Setup (⚠️ Strongly Recommended)

A prompt will appear during installation asking for the RPC URL.

> ⚠️ **Important**: If RPC URL is not configured, core features like proof generation will not work. You can set it up manually later, but **we strongly recommend entering it at this step.**

**Enter Alchemy RPC URL:**

```
Enter RPC URL (https://...) or press Enter to skip: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### (Reference) Manual RPC Setup

If you skipped during installation, you can set it up manually:

1. Create `.env` file in project root:

```bash
echo "RPC_URL='https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'" > .env
```

2. Run tokamak-cli (must run inside Tokamak-Zk-EVM directory):

```bash
cd Tokamak-Zk-EVM
./tokamak-cli --install https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
cd ..
```

---

## 🚀 Running & Testing

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser

### Console Output Example

```
> tokamak-zkp-channel-manager@0.1.0 dev
> next dev

  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
```

---

## 🔄 Channel Flow

The channel progresses through 5 stages:

> 📌 **Note**: A channel requires a minimum of **2 participants**. For local testing, you need another account. Add a new account in MetaMask.

### 0️⃣ Create Channel

- Go to **Create Channel** menu
- Enter participant addresses (minimum 2)
- Set Target Contract (TON)
- Approve transaction to complete channel creation

### 1️⃣ Deposit (State 1: Initialized)

- Participants deposit tokens to the created channel
- Each participant clicks **Deposit** button to deposit TON
- Leader clicks **Initialize State** button to set initial state

### 2️⃣ Transaction (State 2: Open)

- Exchange off-chain transactions
- Click **Sign** button → Sign with wallet
- Confirm in modal to start proof generation
- After proof submission, Leader approves

### 3️⃣ Close (State 3: Closing)

- Anyone can click **Close Channel** button (doesn't have to be Leader)
- Final balance verification and channel close transaction
- Channel state changes to 0 (None) when Close Channel is called

### 4️⃣ Withdraw (State 0 with Withdrawable Balance)

- Each participant withdraws their balance after channel close
- Click **Withdraw** button to execute withdrawal

---

## 📝 Test Checklist

Please verify the following items during testing:

### Basic Flow

- [ ] Does wallet connection work properly?
- [ ] Does channel creation work properly?
- [ ] Does token deposit work properly?
- [ ] Does Initialize State work properly?

### Transaction Stage

- [ ] Can L2 transactions be created?
- [ ] Does proof generation complete?
- [ ] Does proof download work properly?
- [ ] Does proof upload and submission work?

### Close & Withdraw

- [ ] Does Close Channel work properly?
- [ ] Does Withdraw work properly?

### UI/UX

- [ ] Is the Stepper displayed correctly for each stage?
- [ ] Are error messages clear?
- [ ] Are loading states displayed appropriately?

---

## 💬 Feedback

### How to Submit Feedback

Create a **subpage** under this document with your name and leave your feedback there.

**Example Structure:**

```
📄 Tokamak ZKP Channel Manager - Internal Test Guide
  └── 📄 John Doe
  └── 📄 Jane Smith
  └── 📄 Bob Wilson
```

### Feedback Writing Guide

Create a subpage with your name and freely write your feedback.

**Example:**

```
## Feedback #1
Did something here and this happened. (screenshot attached)

## Feedback #2
Clicked this button and it didn't work
```

> 💡 Don't worry about the format, just write freely. Screenshots are always helpful!

---

## ⚠️ Known Issues

### MetaMask Network Change Detection Issue

There is a compatibility issue between the latest version of MetaMask (Chrome) and wagmi connector, causing **network changes to not be detected in real-time**.

**Symptoms:**
- When MetaMask connects to the manager app, it gets locked to the initial network
- Network changes in MetaMask afterwards are not reflected in the app

**Solution:**
- You must **manually change the connected network** in MetaMask for this site
- MetaMask → Connected Sites → Change Network

**Recommendation:**
> ⭐ **Change to Sepolia network in MetaMask BEFORE connecting your wallet!**

> 🔧 This issue will be fixed soon.

---

## ❓ FAQ

### Q: I'm getting submodule-related errors

```bash
# Reset submodules
npm run setup
```

### Q: I entered the wrong RPC URL

Edit the `.env` file:

```bash
# Edit .env file
RPC_URL='https://correct-RPC-URL'
```

---

**Thank you for participating in the test! 🙏**
