/**
 * BridgeCore Contract Hooks
 *
 * Provides hooks for interacting with the BridgeCore contract
 */

import { useAccount } from "wagmi";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  UseReadContractParameters,
  UseWriteContractParameters,
  UseWaitForTransactionReceiptParameters,
  WriteContractParameters,
  WriteContractReturnType,
} from "wagmi";
import {
  CONTRACT_ABIS,
  getContractAddress,
  getContractAbi,
} from "@tokamak/config";
import type { Abi } from "viem";
import { useCallback } from "react";
import { useNetworkId } from "./utils";

/**
 * Get BridgeCore contract address for current network
 */
export function useBridgeCoreAddress(): `0x${string}` {
  const networkId = useNetworkId();
  return getContractAddress("BridgeCore", networkId);
}

/**
 * Get BridgeCore contract ABI
 */
export function useBridgeCoreAbi(): readonly Abi[number][] {
  return getContractAbi("BridgeCore");
}

/**
 * Hook for reading from BridgeCore contract
 */
export function useBridgeCoreRead<
  TAbi extends Abi = typeof CONTRACT_ABIS.BridgeCore
>(config: Omit<UseReadContractParameters<TAbi>, "address" | "abi">) {
  const address = useBridgeCoreAddress();
  const abi = useBridgeCoreAbi();

  return useReadContract({
    ...config,
    address,
    abi,
  } as UseReadContractParameters<TAbi>);
}

/**
 * Hook for writing to BridgeCore contract
 * Returns a writeContract function with address and abi pre-configured
 */
export function useBridgeCoreWrite() {
  const address = useBridgeCoreAddress();
  const abi = useBridgeCoreAbi();
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
 * Hook for waiting for BridgeCore transaction receipt
 */
export function useBridgeCoreWaitForReceipt(
  config: UseWaitForTransactionReceiptParameters
) {
  return useWaitForTransactionReceipt(config);
}
