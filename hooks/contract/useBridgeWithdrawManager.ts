/**
 * BridgeWithdrawManager Contract Hooks
 * 
 * Provides hooks for interacting with the BridgeWithdrawManager contract
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
 * Get BridgeWithdrawManager contract address for current network
 */
function useBridgeWithdrawManagerAddress(): `0x${string}` {
  const networkId = useNetworkId();
  return getContractAddress('BridgeWithdrawManager', networkId);
}

/**
 * Get BridgeWithdrawManager contract ABI
 */
function useBridgeWithdrawManagerAbi(): readonly Abi[number][] {
  return getContractAbi('BridgeWithdrawManager');
}

/**
 * Hook for reading from BridgeWithdrawManager contract
 */
export function useBridgeWithdrawManagerRead<TAbi extends Abi = typeof CONTRACT_ABIS.BridgeWithdrawManager>(
  config: Omit<UseReadContractParameters<TAbi>, 'address' | 'abi'>
) {
  const address = useBridgeWithdrawManagerAddress();
  const abi = useBridgeWithdrawManagerAbi();
  
  return useReadContract({
    ...config,
    address,
    abi: abi as TAbi,
  });
}

/**
 * Hook for writing to BridgeWithdrawManager contract
 */
export function useBridgeWithdrawManagerWrite() {
  return useWriteContract();
}

/**
 * Hook for waiting for BridgeWithdrawManager transaction receipt
 */
export function useBridgeWithdrawManagerWaitForReceipt(
  config: UseWaitForTransactionReceiptParameters
) {
  return useWaitForTransactionReceipt(config);
}

