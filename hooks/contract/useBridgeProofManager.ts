/**
 * BridgeProofManager Contract Hooks
 * 
 * Provides hooks for interacting with the BridgeProofManager contract
 */

import { 
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  UseReadContractParameters,
  UseWaitForTransactionReceiptParameters,
} from 'wagmi';
import { 
  CONTRACT_ABIS, 
  getContractAddress, 
  getContractAbi 
} from '@tokamak/config';
import type { Abi } from 'viem';
import { useNetworkId } from './utils';

/**
 * Get BridgeProofManager contract address for current network
 */
function useBridgeProofManagerAddress(): `0x${string}` {
  const networkId = useNetworkId();
  return getContractAddress('BridgeProofManager', networkId);
}

/**
 * Get BridgeProofManager contract ABI
 */
function useBridgeProofManagerAbi(): readonly Abi[number][] {
  return getContractAbi('BridgeProofManager');
}

/**
 * Hook for reading from BridgeProofManager contract
 */
export function useBridgeProofManagerRead<TAbi extends Abi = typeof CONTRACT_ABIS.BridgeProofManager>(
  config: Omit<UseReadContractParameters<TAbi>, 'address' | 'abi'>
) {
  const address = useBridgeProofManagerAddress();
  const abi = useBridgeProofManagerAbi();
  
  return useReadContract({
    ...config,
    address,
    abi: abi as TAbi,
  });
}

/**
 * Hook for writing to BridgeProofManager contract
 */
export function useBridgeProofManagerWrite() {
  return useWriteContract();
}

/**
 * Hook for waiting for BridgeProofManager transaction receipt
 */
export function useBridgeProofManagerWaitForReceipt(
  config: UseWaitForTransactionReceiptParameters
) {
  return useWaitForTransactionReceipt(config);
}

