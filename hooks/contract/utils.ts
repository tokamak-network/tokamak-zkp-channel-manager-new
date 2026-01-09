/**
 * Contract Hook Utilities
 *
 * Helper functions for contract hooks
 */

import { useChainId } from "wagmi";
import {
  NETWORKS,
  DEFAULT_NETWORK,
  NetworkId,
  getNetworkIdByChainId,
} from "@tokamak/config";

/**
 * Get network ID from chain ID
 */
export function useNetworkId(): NetworkId {
  const chainId = useChainId();
  const networkId = getNetworkIdByChainId(chainId);
  return networkId || DEFAULT_NETWORK;
}
