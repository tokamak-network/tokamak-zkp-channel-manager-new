/**
 * Wagmi Configuration
 * 
 * Configures wagmi with supported chains and providers.
 * 
 * E2E Testing Mode:
 * When NEXT_PUBLIC_E2E_TEST_MODE is set, uses injected connector with Anvil RPC.
 * The mock wallet provider (injected via Playwright) handles signing.
 */

import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { NETWORKS } from '@tokamak/config';

// Configure chains
export const chains = [NETWORKS.sepolia, NETWORKS.mainnet] as const;

// E2E Test mode flag
const isE2ETestMode = typeof window !== 'undefined'
  ? (window as any).__E2E_TEST_MODE__ === true || process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'
  : process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

// RPC URLs
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/PbqCcGx1oHN7yNaFdUJUYqPEN0QSp23S';
const E2E_RPC_URL = process.env.NEXT_PUBLIC_E2E_RPC_URL || 'http://localhost:8545';

// Create connectors - always use injected for E2E (mock provider handles it)
function createConnectors() {
  if (isE2ETestMode) {
    // E2E: only injected connector (will use mock window.ethereum)
    return [injected()];
  }
  
  return [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Tokamak ZKP Channel Manager' }),
  ];
}

export const wagmiConfig = createConfig({
  chains,
  connectors: createConnectors(),
  transports: {
    [NETWORKS.sepolia.id]: http(isE2ETestMode ? E2E_RPC_URL : SEPOLIA_RPC_URL),
    [NETWORKS.mainnet.id]: http(),
  },
});

export { isE2ETestMode };
