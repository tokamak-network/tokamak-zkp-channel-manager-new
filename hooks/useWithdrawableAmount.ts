/**
 * Custom Hook: useWithdrawableAmount
 *
 * Checks if a user has withdrawable amount in a channel
 * Iterates through supported tokens from config and checks on-chain
 * 
 * This hook handles the case where channel data might be reset (state 0)
 * but withdrawal data still exists in the contract
 * 
 * Updated for new contract that uses getValidatedUserSlotValue + getBalanceSlotIndex
 */

import { useMemo, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";
import { toBytes32 } from "@/lib/channelId";
import { SUPPORTED_TOKENS } from "@tokamak/config";

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
 * Uses getValidatedUserSlotValue + getBalanceSlotIndex to check withdrawable amounts
 */
export function useWithdrawableAmount({
  channelId,
}: UseWithdrawableAmountParams): UseWithdrawableAmountResult {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();

  const [withdrawableAmount, setWithdrawableAmount] = useState<bigint>(BigInt(0));
  const [targetContract, setTargetContract] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch withdrawable amounts for all enabled tokens
  useEffect(() => {
    const fetchWithdrawableAmounts = async () => {
      if (!channelIdBytes32 || !address || !bridgeCoreAddress || !publicClient || !isConnected) {
        setWithdrawableAmount(BigInt(0));
        setTargetContract(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check each enabled token for withdrawable amount
        for (const tokenAddress of enabledTokens) {
          try {
            // Get balance slot index for this token contract
            const balanceSlotIndex = await publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getBalanceSlotIndex",
              args: [tokenAddress],
            }) as number;

            // Get validated user slot value (withdrawable amount)
            const validatedValue = await publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getValidatedUserSlotValue",
              args: [channelIdBytes32, address as `0x${string}`, balanceSlotIndex],
            }) as bigint;

            // Check if user has already withdrawn
            const hasWithdrawn = await publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "hasUserWithdrawn",
              args: [channelIdBytes32, address as `0x${string}`, tokenAddress],
            }) as boolean;

            // If not withdrawn and has value, this is the withdrawable amount
            if (!hasWithdrawn && validatedValue > BigInt(0)) {
              console.log("[useWithdrawableAmount] Found withdrawable amount:", {
                tokenAddress,
                amount: validatedValue.toString(),
              });
              setWithdrawableAmount(validatedValue);
              setTargetContract(tokenAddress);
              setIsLoading(false);
              return;
            }
          } catch (tokenError) {
            // Token might not be configured for this channel, continue to next
            console.debug("[useWithdrawableAmount] Token check failed:", tokenAddress, tokenError);
          }
        }

        // No withdrawable amount found
        setWithdrawableAmount(BigInt(0));
        setTargetContract(null);
      } catch (err) {
        console.error("[useWithdrawableAmount] Error checking withdrawable amounts:", err);
        setError(err instanceof Error ? err.message : "Failed to check withdrawable amount");
        setWithdrawableAmount(BigInt(0));
        setTargetContract(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawableAmounts();
  }, [channelIdBytes32, address, bridgeCoreAddress, bridgeCoreAbi, publicClient, isConnected, enabledTokens]);

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
      });
    }
  }, [channelId, address, enabledTokens, isLoading, withdrawableAmount, hasWithdrawableAmount, targetContract]);

  return {
    withdrawableAmount,
    hasWithdrawableAmount,
    isLoading,
    targetContract,
    error,
  };
}
