/**
 * BridgeDepositManager Contract Hooks
 * 
 * Provides hooks for interacting with the BridgeDepositManager contract
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
 * Get BridgeDepositManager contract address for current network
 */
export function useBridgeDepositManagerAddress(): `0x${string}` {
  const networkId = useNetworkId();
  return getContractAddress('BridgeDepositManager', networkId);
}

/**
 * Get BridgeDepositManager contract ABI
 */
function useBridgeDepositManagerAbi(): readonly Abi[number][] {
  return getContractAbi('BridgeDepositManager');
}

/**
 * Hook for reading from BridgeDepositManager contract
 */
export function useBridgeDepositManagerRead<TAbi extends Abi = typeof CONTRACT_ABIS.BridgeDepositManager>(
  config: Omit<UseReadContractParameters<TAbi>, 'address' | 'abi'>
) {
  const address = useBridgeDepositManagerAddress();
  const abi = useBridgeDepositManagerAbi();
  
  return useReadContract({
    ...config,
    address,
    abi: abi as TAbi,
  });
}

/**
 * Hook for writing to BridgeDepositManager contract
 * Returns a writeContract function with address and abi pre-configured
 */
export function useBridgeDepositManagerWrite() {
  const address = useBridgeDepositManagerAddress();
  const abi = useBridgeDepositManagerAbi();
  const { writeContract, ...rest } = useWriteContract();

  const writeContractWithConfig = useCallback(
    async (
      params: Omit<WriteContractParameters, 'address' | 'abi'>
    ): Promise<WriteContractReturnType> => {
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
 * Hook for waiting for BridgeDepositManager transaction receipt
 */
export function useBridgeDepositManagerWaitForReceipt(
  config: UseWaitForTransactionReceiptParameters
) {
  return useWaitForTransactionReceipt(config);
}

