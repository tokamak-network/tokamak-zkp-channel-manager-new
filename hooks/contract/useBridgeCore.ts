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
      params: Omit<Parameters<typeof writeContract>[0], 'address' | 'abi'>
    ): void => {
      writeContract({
        ...params,
        address,
        abi: abi as Abi,
      } as Parameters<typeof writeContract>[0]);
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

/**
 * Helper function to read from BridgeCore contract in async contexts
 * Use this when you need to call readContract inside async functions
 * (e.g., inside useCallback, useEffect, or event handlers)
 * 
 * This function uses the address and ABI from useBridgeCoreAddress() and useBridgeCoreAbi()
 * which should be called at the hook level and passed to this function.
 * 
 * @param config - Wagmi config from useConfig()
 * @param address - BridgeCore contract address (from useBridgeCoreAddress())
 * @param abi - BridgeCore contract ABI (from useBridgeCoreAbi())
 * @param params - Function name and arguments
 * @returns Promise with the contract read result
 */
export async function readBridgeCoreContract<TResult = unknown>(
  config: unknown,
  address: `0x${string}`,
  abi: readonly Abi[number][],
  params: {
    functionName: string;
    args?: readonly unknown[];
  }
): Promise<TResult> {
  const { readContract } = await import("@wagmi/core");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return readContract(config as any, {
    address,
    abi,
    functionName: params.functionName,
    args: params.args,
  }) as Promise<TResult>;
}
