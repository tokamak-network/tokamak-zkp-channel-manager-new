/**
 * Hook: usePreAllocatedLeavesCount
 *
 * Fetches pre-allocated leaves count for selected tokens from the BridgeCore contract.
 * Results are cached indefinitely since these values don't change frequently.
 */

import { useQueries } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
import { useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";

interface UsePreAllocatedLeavesCountResult {
  /** Total pre-allocated leaves count (sum of all selected tokens) */
  totalPreAllocatedCount: number;
  /** Pre-allocated count per token address */
  countByToken: Record<`0x${string}`, number>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
}

/**
 * Fetch pre-allocated leaves count for multiple token addresses
 *
 * @param tokenAddresses - Array of token contract addresses
 * @returns Total and per-token pre-allocated leaves count
 *
 * @example
 * const { totalPreAllocatedCount, isLoading } = usePreAllocatedLeavesCount([
 *   "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044", // TON
 * ]);
 */
export function usePreAllocatedLeavesCount(
  tokenAddresses: `0x${string}`[]
): UsePreAllocatedLeavesCountResult {
  const config = useConfig();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();

  // Query for each token address
  const queries = useQueries({
    queries: tokenAddresses.map((tokenAddress) => ({
      queryKey: ["preAllocatedLeavesCount", tokenAddress, bridgeCoreAddress],
      queryFn: async () => {
        const count = await readContract(config, {
          address: bridgeCoreAddress,
          abi: bridgeCoreAbi,
          functionName: "getPreAllocatedLeavesCount",
          args: [tokenAddress],
        });
        return {
          tokenAddress,
          count: Number(count),
        };
      },
      staleTime: Infinity, // Cache indefinitely - value doesn't change
      gcTime: Infinity,
      enabled: !!tokenAddress && !!bridgeCoreAddress,
    })),
  });

  // Calculate totals
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const countByToken: Record<`0x${string}`, number> = {};
  let totalPreAllocatedCount = 0;

  queries.forEach((query) => {
    if (query.data) {
      countByToken[query.data.tokenAddress] = query.data.count;
      totalPreAllocatedCount += query.data.count;
    }
  });

  return {
    totalPreAllocatedCount,
    countByToken,
    isLoading,
    isError,
  };
}
