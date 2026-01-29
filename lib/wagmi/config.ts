/**
 * Wagmi Configuration
 * 
 * Configures wagmi with supported chains and providers.
 * Uses Alchemy RPC for Sepolia to avoid rate limiting issues.
 * 
 * E2E Testing Mode:
 * When NEXT_PUBLIC_E2E_TEST_MODE is set, uses mock connector for testing.
 */

import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet, mock } from 'wagmi/connectors';
import { NETWORKS } from '@tokamak/config';
import { parseEther } from 'viem';

// Configure chains (using Wagmi chain definitions from config)
export const chains = [NETWORKS.sepolia, NETWORKS.mainnet] as const;

// E2E Test mode flag - set via environment variable
// Check both server and client side
const isE2ETestMode = typeof window !== 'undefined'
  ? (window as any).__E2E_TEST_MODE__ === true || process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'
  : process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

// Test accounts (matching Anvil default accounts)
const TEST_ACCOUNTS = {
  leader: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const,
  },
  participant: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const,
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const,
  },
};

// Alchemy RPC URL for Sepolia (hardcoded to avoid rate limiting)
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/PbqCcGx1oHN7yNaFdUJUYqPEN0QSp23S';

// E2E mode RPC URL (Anvil local node)
const E2E_RPC_URL = process.env.NEXT_PUBLIC_E2E_RPC_URL || 'http://localhost:8545';

// Determine which account to use in E2E mode
// Can be controlled via NEXT_PUBLIC_E2E_ACCOUNT env var
const e2eAccountType = (process.env.NEXT_PUBLIC_E2E_ACCOUNT || 'leader') as 'leader' | 'participant';
const e2eAccount = TEST_ACCOUNTS[e2eAccountType];

// Create connectors based on mode
function createConnectors() {
  if (isE2ETestMode) {
    // E2E mode: use mock connector that auto-connects
    return [
      mock({
        accounts: [e2eAccount.address],
        features: {
          reconnect: true,
        },
      }),
      injected(), // Keep injected for compatibility
    ];
  }
  
  // Production mode: normal connectors
  return [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Tokamak ZKP Channel Manager' }),
  ];
}

// Create wagmi config
// Using dedicated Alchemy RPC for Sepolia to avoid MetaMask default RPC rate limiting
export const wagmiConfig = createConfig({
  chains,
  connectors: createConnectors(),
  transports: {
    [NETWORKS.sepolia.id]: http(isE2ETestMode ? E2E_RPC_URL : SEPOLIA_RPC_URL),
    [NETWORKS.mainnet.id]: http(),
  },
});

// Export test mode flag for components to check
export { isE2ETestMode };
