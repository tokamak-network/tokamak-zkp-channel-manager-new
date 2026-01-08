/**
 * Contract Hook Utilities
 * 
 * Helper functions for contract hooks
 */

import { useChainId } from 'wagmi';
import { NETWORKS, DEFAULT_NETWORK, NetworkId, getNetworkByChainId } from '@tokamak/config';

/**
 * Get network ID from chain ID
 */
export function useNetworkId(): NetworkId {
  const chainId = useChainId();
  const network = getNetworkByChainId(chainId);
  
  if (network) {
    // Find network ID by matching chain ID
    const found = Object.entries(NETWORKS).find(
      ([_, config]) => config.id === chainId
    );
    if (found) {
      return found[0] as NetworkId;
    }
  }
  
  return DEFAULT_NETWORK;
}

