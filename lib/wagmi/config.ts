/**
 * Wagmi Configuration
 * 
 * Configures wagmi with supported chains and providers
 */

import { createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { NETWORKS } from '@tokamak/config';

// Get RPC URL from environment or use public RPC
const getRpcUrl = (chainId: number): string => {
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  if (network?.rpcUrl) {
    // In production, you'd add API key here
    return network.rpcUrl;
  }
  // Fallback to public RPC
  return chainId === sepolia.id 
    ? 'https://sepolia.infura.io/v3/'
    : 'https://mainnet.infura.io/v3/';
};

// Configure chains
export const chains = [sepolia, mainnet] as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'Tokamak ZKP Channel Manager' }),
  ],
  transports: {
    [sepolia.id]: http(getRpcUrl(sepolia.id)),
    [mainnet.id]: http(getRpcUrl(mainnet.id)),
  },
});

