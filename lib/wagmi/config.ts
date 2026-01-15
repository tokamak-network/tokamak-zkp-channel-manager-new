/**
 * Wagmi Configuration
 * 
 * Configures wagmi with supported chains and providers.
 * Uses Alchemy RPC for Sepolia to avoid rate limiting issues.
 */

import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { NETWORKS } from '@tokamak/config';

// Configure chains (using Wagmi chain definitions from config)
export const chains = [NETWORKS.sepolia, NETWORKS.mainnet] as const;

// Alchemy RPC URL for Sepolia (hardcoded to avoid rate limiting)
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/PbqCcGx1oHN7yNaFdUJUYqPEN0QSp23S';

// Create wagmi config
// Using dedicated Alchemy RPC for Sepolia to avoid MetaMask default RPC rate limiting
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Tokamak ZKP Channel Manager' }),
  ],
  transports: {
    [NETWORKS.sepolia.id]: http(SEPOLIA_RPC_URL), // Use Alchemy RPC to avoid rate limiting
    [NETWORKS.mainnet.id]: http(), // Uses wallet's RPC by default
  },
});

