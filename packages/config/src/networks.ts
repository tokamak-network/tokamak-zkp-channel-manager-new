/**
 * Network Configuration
 *
 * Uses Wagmi chain definitions for consistency with Wagmi configuration.
 * RPC URLs default to wallet's connected RPC provider.
 */

import { sepolia, mainnet, type Chain } from "wagmi/chains";
import { CONTRACT_ADDRESSES as AUTO_GENERATED_ADDRESSES } from "./contracts/addresses";
import {
  BRIDGECORE_ABI,
  BRIDGEDEPOSITMANAGER_ABI,
  BRIDGEPROOFMANAGER_ABI,
  BRIDGEWITHDRAWMANAGER_ABI,
  BRIDGEADMINMANAGER_ABI,
  TOKAMAKVERIFIER_ABI,
  GROTH16VERIFIER16LEAVES_ABI,
  GROTH16VERIFIER32LEAVES_ABI,
  GROTH16VERIFIER64LEAVES_ABI,
  GROTH16VERIFIER128LEAVES_ABI,
} from "./contracts/abis";
import type { Abi } from "viem";

/**
 * Supported Networks (Wagmi Chains)
 *
 * Uses Wagmi's built-in chain definitions for consistency.
 * RPC URLs are handled by Wagmi transports, defaulting to wallet's RPC.
 */
export const NETWORKS = {
  sepolia,
  mainnet,
} as const;

export type NetworkId = keyof typeof NETWORKS;

/**
 * Default Network
 */
export const DEFAULT_NETWORK: NetworkId = "sepolia";

/**
 * Get chain by chain ID
 */
export function getChainByChainId(chainId: number): Chain | undefined {
  return Object.values(NETWORKS).find((chain) => chain.id === chainId);
}

/**
 * Get network ID from chain ID
 */
export function getNetworkIdByChainId(chainId: number): NetworkId | undefined {
  const found = Object.entries(NETWORKS).find(
    ([_, chain]) => chain.id === chainId
  );
  return found ? (found[0] as NetworkId) : undefined;
}

/**
 * Check if chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return Object.values(NETWORKS).some((chain) => chain.id === chainId);
}

/**
 * Get network config by chain ID (for backward compatibility)
 * @deprecated Use getChainByChainId instead
 */
export function getNetworkByChainId(chainId: number) {
  return getChainByChainId(chainId);
}

/**
 * Contract ABIs
 *
 * Maps contract names to their ABIs
 */
export const CONTRACT_ABIS = {
  BridgeCore: BRIDGECORE_ABI,
  BridgeDepositManager: BRIDGEDEPOSITMANAGER_ABI,
  BridgeProofManager: BRIDGEPROOFMANAGER_ABI,
  BridgeWithdrawManager: BRIDGEWITHDRAWMANAGER_ABI,
  BridgeAdminManager: BRIDGEADMINMANAGER_ABI,
  TokamakVerifier: TOKAMAKVERIFIER_ABI,
  Groth16Verifier16Leaves: GROTH16VERIFIER16LEAVES_ABI,
  Groth16Verifier32Leaves: GROTH16VERIFIER32LEAVES_ABI,
  Groth16Verifier64Leaves: GROTH16VERIFIER64LEAVES_ABI,
  Groth16Verifier128Leaves: GROTH16VERIFIER128LEAVES_ABI,
} as const satisfies Record<string, readonly Abi[number][]>;

/**
 * Contract Addresses per Network (by Chain ID)
 *
 * Uses auto-generated addresses from contracts/addresses.ts
 * Sepolia addresses are automatically synced from Tokamak-zk-EVM-contracts repository
 *
 * Keyed by chain ID for Wagmi compatibility
 */
export const CONTRACT_ADDRESSES = {
  [sepolia.id]: {
    // Bridge contracts
    BridgeCore: AUTO_GENERATED_ADDRESSES.sepolia.BridgeCore,
    BridgeDepositManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeDepositManager,
    BridgeProofManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeProofManager,
    BridgeWithdrawManager:
      AUTO_GENERATED_ADDRESSES.sepolia.BridgeWithdrawManager,
    BridgeAdminManager: AUTO_GENERATED_ADDRESSES.sepolia.BridgeAdminManager,

    // Verifiers
    TokamakVerifier: AUTO_GENERATED_ADDRESSES.sepolia.TokamakVerifier,
    Groth16Verifier16Leaves:
      AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier16Leaves,
    Groth16Verifier32Leaves:
      AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier32Leaves,
    Groth16Verifier64Leaves:
      AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier64Leaves,
    Groth16Verifier128Leaves:
      AUTO_GENERATED_ADDRESSES.sepolia.Groth16Verifier128Leaves,

    // FROST - Not included in auto-generated addresses, using placeholder
    ZecFrost: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
  [mainnet.id]: {
    // TODO: Update when mainnet contracts are deployed
    BridgeCore: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeDepositManager:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeProofManager:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeWithdrawManager:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    BridgeAdminManager:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    TokamakVerifier:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier16Leaves:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier32Leaves:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier64Leaves:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    Groth16Verifier128Leaves:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ZecFrost: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const satisfies Record<number, Record<string, `0x${string}`>>;

/**
 * Contract name type
 */
export type ContractName = keyof typeof CONTRACT_ABIS;

/**
 * Get contract address
 *
 * @param contract - Contract name
 * @param networkOrChainId - Network ID (e.g., 'sepolia') or chain ID (e.g., 11155111). Defaults to DEFAULT_NETWORK
 * @returns Contract address
 */
export function getContractAddress(
  contract: ContractName,
  networkOrChainId: NetworkId | number = DEFAULT_NETWORK
): `0x${string}` {
  // If it's a number, treat it as chain ID
  if (typeof networkOrChainId === "number") {
    const addresses = CONTRACT_ADDRESSES[networkOrChainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) {
      throw new Error(
        `No contract addresses found for chain ID: ${networkOrChainId}`
      );
    }
    return addresses[contract as keyof typeof addresses];
  }

  // Otherwise, treat it as network ID and get chain ID
  const chain = NETWORKS[networkOrChainId];
  if (!chain) {
    throw new Error(`Unknown network: ${networkOrChainId}`);
  }

  const addresses = CONTRACT_ADDRESSES[chain.id];
  if (!addresses) {
    throw new Error(
      `No contract addresses found for network: ${networkOrChainId}`
    );
  }

  return addresses[contract];
}

/**
 * Get contract ABI
 */
export function getContractAbi(contract: ContractName): readonly Abi[number][] {
  return CONTRACT_ABIS[contract];
}
