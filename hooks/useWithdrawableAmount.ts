/**
 * Custom Hook: useWithdrawableAmount
 *
 * Checks if a user has withdrawable amount in a channel
 * This hook handles the case where channel data might be reset (state 0)
 * but withdrawal data still exists in the contract
 *
 * It uses two strategies to get targetContract:
 * 1. From contract (getChannelTargetContract) - may return 0x0 after cleanup
 * 2. From API/DB as fallback - persists even after cleanup
 */

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useBridgeCoreRead } from "@/hooks/contract";
import { toBytes32 } from "@/lib/channelId";

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
  /** Target contract address (from contract or API fallback) */
  targetContract: `0x${string}` | null;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook for checking withdrawable amount for a user in a channel
 */
export function useWithdrawableAmount({
  channelId,
}: UseWithdrawableAmountParams): UseWithdrawableAmountResult {
  const { address, isConnected } = useAccount();
  const [targetContractFromApi, setTargetContractFromApi] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Get channelId as bytes32
  const channelIdBytes32 = useMemo(() => {
    if (!channelId) return undefined;
    try {
      return toBytes32(channelId) as `0x${string}`;
    } catch {
      return channelId as `0x${string}`;
    }
  }, [channelId]);

  // Get targetContract from contract (may be 0x0 after cleanupChannel)
  const { 
    data: targetContractFromContract,
    isLoading: isLoadingContract,
  } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: channelIdBytes32 ? [channelIdBytes32] : undefined,
    query: {
      enabled: !!channelIdBytes32 && isConnected,
    },
  });

  // Fetch targetContract from API as fallback (stored in DB, persists after cleanupChannel)
  useEffect(() => {
    const fetchTargetContract = async () => {
      if (!channelId) return;
      
      setIsLoadingApi(true);
      setApiError(null);
      
      try {
        const response = await fetch(`/api/channels/${encodeURIComponent(channelId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.targetContract) {
            setTargetContractFromApi(data.data.targetContract);
            console.log("[useWithdrawableAmount] Got targetContract from API:", data.data.targetContract);
          }
        }
      } catch (error) {
        console.error("[useWithdrawableAmount] Failed to fetch channel from API:", error);
        setApiError("Failed to fetch channel data");
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchTargetContract();
  }, [channelId]);

  // Use contract targetContract if valid, otherwise use API fallback
  const targetContract = useMemo(() => {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    
    if (
      targetContractFromContract &&
      String(targetContractFromContract).toLowerCase() !== zeroAddress.toLowerCase()
    ) {
      return targetContractFromContract as `0x${string}`;
    }
    
    if (targetContractFromApi) {
      return targetContractFromApi as `0x${string}`;
    }
    
    return null;
  }, [targetContractFromContract, targetContractFromApi]);

  // Debug log
  useEffect(() => {
    if (channelId && address) {
      console.log("[useWithdrawableAmount] Target contract check:", {
        channelId,
        targetContractFromContract,
        targetContractFromApi,
        finalTargetContract: targetContract,
        isLoadingContract,
        isLoadingApi,
      });
    }
  }, [channelId, address, targetContractFromContract, targetContractFromApi, targetContract, isLoadingContract, isLoadingApi]);

  // Get withdrawable amount
  const { 
    data: withdrawableAmountRaw,
    isLoading: isLoadingAmount,
  } = useBridgeCoreRead({
    functionName: "getWithdrawableAmount",
    args:
      channelIdBytes32 && address && targetContract
        ? [channelIdBytes32, address as `0x${string}`, targetContract]
        : undefined,
    query: {
      enabled: !!channelIdBytes32 && !!address && !!targetContract && isConnected,
    },
  });

  // Convert to bigint
  const withdrawableAmount = useMemo(() => {
    if (withdrawableAmountRaw === undefined) return BigInt(0);
    try {
      return BigInt(withdrawableAmountRaw.toString());
    } catch {
      return BigInt(0);
    }
  }, [withdrawableAmountRaw]);

  // Check if has withdrawable amount
  const hasWithdrawableAmount = useMemo(() => {
    // Still loading
    if (isLoadingContract || isLoadingApi || isLoadingAmount) return undefined;
    // No target contract found
    if (!targetContract) return false;
    // Check amount
    return withdrawableAmount > BigInt(0);
  }, [isLoadingContract, isLoadingApi, isLoadingAmount, targetContract, withdrawableAmount]);

  // Debug log for amount
  useEffect(() => {
    if (channelId && address && targetContract) {
      console.log("[useWithdrawableAmount] Amount check:", {
        channelId,
        address,
        targetContract,
        withdrawableAmountRaw,
        withdrawableAmount: withdrawableAmount.toString(),
        hasWithdrawableAmount,
      });
    }
  }, [channelId, address, targetContract, withdrawableAmountRaw, withdrawableAmount, hasWithdrawableAmount]);

  return {
    withdrawableAmount,
    hasWithdrawableAmount,
    isLoading: isLoadingContract || isLoadingApi || isLoadingAmount,
    targetContract,
    error: apiError,
  };
}
