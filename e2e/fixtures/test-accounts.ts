/**
 * Test Accounts for E2E Testing
 *
 * These accounts are used with Anvil fork for testing.
 * In CI, Anvil will automatically fund these accounts.
 */

// Anvil default test accounts (deterministic)
// These are the first two accounts from Anvil's default mnemonic
export const TEST_ACCOUNTS = {
  // Leader account (creates and manages channel)
  leader: {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`,
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`,
  },
  // Participant account (joins channel)
  participant: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`,
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as `0x${string}`,
  },
} as const;

// Token addresses on Sepolia (will be forked by Anvil)
export const TOKEN_ADDRESSES = {
  TON: "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044" as `0x${string}`,
} as const;

// Initial token balance to mint for test accounts (in wei)
export const INITIAL_TOKEN_BALANCE = BigInt("1000000000000000000000"); // 1000 TON

// Initial ETH balance for gas (Anvil provides this automatically)
export const INITIAL_ETH_BALANCE = BigInt("10000000000000000000000"); // 10000 ETH
