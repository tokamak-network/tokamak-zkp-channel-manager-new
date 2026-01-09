/**
 * Wagmi Configuration
 * 
 * Configures wagmi with supported chains and providers.
 * RPC URLs default to wallet's connected RPC provider.
 */

import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { NETWORKS } from '@tokamak/config';

// Configure chains (using Wagmi chain definitions from config)
export const chains = [NETWORKS.sepolia, NETWORKS.mainnet] as const;

// Create wagmi config
// Using http() without arguments defaults to wallet's RPC provider
// This allows users to use their wallet's configured RPC endpoint
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Tokamak ZKP Channel Manager' }),
  ],
  transports: {
    [NETWORKS.sepolia.id]: http(), // Uses wallet's RPC by default
    [NETWORKS.mainnet.id]: http(), // Uses wallet's RPC by default
  },
});

