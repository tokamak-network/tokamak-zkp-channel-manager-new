/**
 * Network Configuration
 */

import { CONTRACT_ADDRESSES as AUTO_GENERATED_ADDRESSES } from './contracts/addresses';

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
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  mainnet: {
    id: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
  },
} as const satisfies Record<string, NetworkConfig>;

export type NetworkId = keyof typeof NETWORKS;

/**
 * Default Network
 */
export const DEFAULT_NETWORK: NetworkId = "sepolia";

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(
  chainId: number
): NetworkConfig | undefined {
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
 * 
 * Uses auto-generated addresses from contracts/addresses.ts
 * Sepolia addresses are automatically synced from Tokamak-zk-EVM-contracts repository
 */
export const CONTRACT_ADDRESSES = {
  sepolia: {
    // Bridge contracts
    BridgeCore: AUTO_GENERATED_ADDRESSES.sepolia.BridgeCore,
    BridgeDepositManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeDepositManager,
    BridgeProofManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeProofManager,
    BridgeWithdrawManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeWithdrawManager,
    BridgeAdminManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeAdminManager,
    
    // Verifiers
    TokamakVerifier: AUTO_GENERATED_ADDRESSES.sepolia.TokamakVerifier,
    Groth16Verifier16Leaves: AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier16Leaves,
    Groth16Verifier32Leaves: AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier32Leaves,
    Groth16Verifier64Leaves: AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier64Leaves,
    Groth16Verifier128Leaves: AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier128Leaves,
    
    // FROST
    ZecFrost: AUTO_GENERATED_ADDRESSES.sepolia.ZecFrost,
  },
  mainnet: {
    // TODO: Update when mainnet contracts are deployed
    BridgeCore: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeDepositManager: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeProofManager: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeWithdrawManager: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeAdminManager: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    TokamakVerifier: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier16Leaves: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier32Leaves: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier64Leaves: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier128Leaves: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ZecFrost: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const satisfies Record<NetworkId, Record<string, `0x${string}`>>;

/**
 * Get contract address
 */
export function getContractAddress(
  contract: keyof (typeof CONTRACT_ADDRESSES)["sepolia"],
  network: NetworkId = DEFAULT_NETWORK
): `0x${string}` {
  return CONTRACT_ADDRESSES[network][contract];
}
