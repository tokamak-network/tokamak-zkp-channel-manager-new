/**
 * Network Configuration
 */

export interface NetworkConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

/**
 * Supported Networks
 */
export const NETWORKS = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  mainnet: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
    isTestnet: false,
  },
} as const satisfies Record<string, NetworkConfig>;

export type NetworkId = keyof typeof NETWORKS;

/**
 * Default Network
 */
export const DEFAULT_NETWORK: NetworkId = 'sepolia';

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find((network) => network.id === chainId);
}

/**
 * Check if chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return Object.values(NETWORKS).some((network) => network.id === chainId);
}

/**
 * Contract Addresses per Network
 */
export const CONTRACT_ADDRESSES = {
  sepolia: {
    rollupBridge: '0x0000000000000000000000000000000000000000', // TODO: Deploy and update
    channelManager: '0x0000000000000000000000000000000000000000',
    verifier: '0x0000000000000000000000000000000000000000',
  },
  mainnet: {
    rollupBridge: '0x0000000000000000000000000000000000000000',
    channelManager: '0x0000000000000000000000000000000000000000',
    verifier: '0x0000000000000000000000000000000000000000',
  },
} as const satisfies Record<NetworkId, Record<string, `0x${string}`>>;

/**
 * Get contract address
 */
export function getContractAddress(
  contract: keyof (typeof CONTRACT_ADDRESSES)['sepolia'],
  network: NetworkId = DEFAULT_NETWORK
): `0x${string}` {
  return CONTRACT_ADDRESSES[network][contract];
}

