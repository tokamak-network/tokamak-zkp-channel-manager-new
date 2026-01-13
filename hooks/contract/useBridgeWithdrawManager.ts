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
  WriteContractParameters,
  WriteContractReturnType,
} from 'wagmi';
import { 
  CONTRACT_ABIS, 
  getContractAddress, 
  getContractAbi 
} from '@tokamak/config';
import type { Abi } from 'viem';
import { useNetworkId } from './utils';
import { useCallback } from 'react';

/**
 * Get BridgeWithdrawManager contract address for current network
 */
export function useBridgeWithdrawManagerAddress(): `0x${string}` {
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
 * Returns a writeContract function with address and abi pre-configured
 */
export function useBridgeWithdrawManagerWrite() {
  const address = useBridgeWithdrawManagerAddress();
  const abi = useBridgeWithdrawManagerAbi();
  const { writeContract, ...rest } = useWriteContract();

  const writeContractWithConfig = useCallback(
    (
      params: Omit<WriteContractParameters, 'address' | 'abi'>
    ): WriteContractReturnType => {
      return writeContract({
        ...params,
        address,
        abi: abi as Abi,
      });
    },
    [writeContract, address, abi]
  );

  return {
    writeContract: writeContractWithConfig,
    ...rest,
  };
}

/**
 * Hook for waiting for BridgeWithdrawManager transaction receipt
 */
export function useBridgeWithdrawManagerWaitForReceipt(
  config: UseWaitForTransactionReceiptParameters
) {
  return useWaitForTransactionReceipt(config);
}

