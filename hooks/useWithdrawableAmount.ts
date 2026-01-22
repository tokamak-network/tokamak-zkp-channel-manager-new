/**
 * Custom Hook: useWithdrawableAmount
 *
 * Checks if a user has withdrawable amount in a channel
 * Iterates through supported tokens from config and checks on-chain
 * 
 * This hook handles the case where channel data might be reset (state 0)
 * but withdrawal data still exists in the contract
 */

import { useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueries } from "@tanstack/react-query";
import { useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";
import { toBytes32 } from "@/lib/channelId";
import { SUPPORTED_TOKENS } from "@tokamak/config";
import { readContract } from "@wagmi/core";
import { useConfig } from "wagmi";

interface UseWithdrawableAmountParams {
  channelId: string | null | undefined;
}

interface UseWithdrawableAmountResult {
  /** The withdrawable amount in wei (bigint) */
  withdrawableAmount: bigint;
  /** Whether user has withdrawable amount > 0 */
  hasWithdrawableAmount: boolean | undefined;
  /** Whether the check is still loading */
  isLoading: boolean;
  /** Target contract address that has withdrawable amount */
  targetContract: `0x${string}` | null;
  /** Error message if any */
  error: string | null;
}

// Get enabled token addresses from config
const getEnabledTokenAddresses = (): `0x${string}`[] => {
  return Object.values(SUPPORTED_TOKENS)
    .filter((token) => token.enabled && token.address !== "0x0000000000000000000000000000000000000000")
    .map((token) => token.address);
};

/**
 * Hook for checking withdrawable amount for a user in a channel
 * Iterates through all enabled tokens from config to find any withdrawable amount
 */
export function useWithdrawableAmount({
  channelId,
}: UseWithdrawableAmountParams): UseWithdrawableAmountResult {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();

  // Get channelId as bytes32
  const channelIdBytes32 = useMemo(() => {
    if (!channelId) return undefined;
    try {
      return toBytes32(channelId) as `0x${string}`;
    } catch {
      return channelId as `0x${string}`;
    }
  }, [channelId]);

  // Get enabled token addresses
  const enabledTokens = useMemo(() => getEnabledTokenAddresses(), []);

  // Query withdrawable amount for each enabled token
  const withdrawableQueries = useQueries({
    queries: enabledTokens.map((tokenAddress) => ({
      queryKey: ["withdrawableAmount", channelIdBytes32, address, tokenAddress, bridgeCoreAddress],
      queryFn: async () => {
        if (!channelIdBytes32 || !address || !bridgeCoreAddress) {
          return { tokenAddress, amount: BigInt(0) };
        }

        try {
          const result = await readContract(config, {
            address: bridgeCoreAddress,
            abi: bridgeCoreAbi,
            functionName: "getWithdrawableAmount",
            args: [channelIdBytes32, address as `0x${string}`, tokenAddress],
          });

          const amount = result ? BigInt(result.toString()) : BigInt(0);
          
          console.log("[useWithdrawableAmount] Query result:", {
            tokenAddress,
            amount: amount.toString(),
          });

          return { tokenAddress, amount };
        } catch (error) {
          console.error("[useWithdrawableAmount] Query error for token:", tokenAddress, error);
          return { tokenAddress, amount: BigInt(0) };
        }
      },
      enabled: !!channelIdBytes32 && !!address && isConnected && !!bridgeCoreAddress,
      staleTime: 10000, // 10 seconds
    })),
  });

  // Check if any query is still loading
  const isLoading = withdrawableQueries.some((q) => q.isLoading);

  // Find the first token with positive withdrawable amount
  const { withdrawableAmount, targetContract } = useMemo(() => {
    for (const query of withdrawableQueries) {
      if (query.data && query.data.amount > BigInt(0)) {
        return {
          withdrawableAmount: query.data.amount,
          targetContract: query.data.tokenAddress as `0x${string}`,
        };
      }
    }
    return {
      withdrawableAmount: BigInt(0),
      targetContract: null,
    };
  }, [withdrawableQueries]);

  // Check if has withdrawable amount
  const hasWithdrawableAmount = useMemo(() => {
    if (isLoading) return undefined;
    return withdrawableAmount > BigInt(0);
  }, [isLoading, withdrawableAmount]);

  // Debug log
  useEffect(() => {
    if (channelId && address) {
      console.log("[useWithdrawableAmount] Check result:", {
        channelId,
        address,
        enabledTokens,
        isLoading,
        withdrawableAmount: withdrawableAmount.toString(),
        hasWithdrawableAmount,
        targetContract,
        queryResults: withdrawableQueries.map((q) => ({
          isLoading: q.isLoading,
          data: q.data,
        })),
      });
    }
  }, [channelId, address, enabledTokens, isLoading, withdrawableAmount, hasWithdrawableAmount, targetContract, withdrawableQueries]);

  return {
    withdrawableAmount,
    hasWithdrawableAmount,
    isLoading,
    targetContract,
    error: null,
  };
}
