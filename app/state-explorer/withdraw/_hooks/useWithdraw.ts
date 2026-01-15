/**
 * Custom Hook: useWithdraw
 *
 * Handles withdraw transaction flow and state management
 */

import { useEffect, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { toBytes32 } from "@/lib/channelId";
import {
  useBridgeWithdrawManagerWrite,
  useBridgeWithdrawManagerWaitForReceipt,
} from "@/hooks/contract";
import { useBridgeCoreRead } from "@/hooks/contract";

interface UseWithdrawParams {
  channelId: string | null;
}

/**
 * Hook for managing withdraw transactions
 */
export function useWithdraw({ channelId }: UseWithdrawParams) {
  const { address, isConnected } = useAccount();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get targetContract from channel info
  const { data: channelTargetContract } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: channelId ? [toBytes32(channelId) as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected,
    },
  });

  // Prepare withdraw transaction
  const {
    writeContract: writeWithdraw,
    data: withdrawTxHash,
    isPending: isWithdrawPending,
    error: writeError,
  } = useBridgeWithdrawManagerWrite();

  const {
    isLoading: isWaitingWithdraw,
    isSuccess: withdrawSuccess,
    error: withdrawTxError,
  } = useBridgeWithdrawManagerWaitForReceipt({
    hash: withdrawTxHash,
    query: {
      enabled: !!withdrawTxHash,
    },
  });

  // Update withdrawing state
  useEffect(() => {
    setIsWithdrawing(isWaitingWithdraw || isWithdrawPending);
  }, [isWaitingWithdraw, isWithdrawPending]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess && withdrawTxHash) {
      setIsWithdrawing(false);
      setError(null);
      console.log("✅ Withdraw completed successfully:", withdrawTxHash);
    }
  }, [withdrawSuccess, withdrawTxHash]);

  // Handle withdraw error
  useEffect(() => {
    if (writeError || withdrawTxError) {
      const errorMessage =
        writeError?.message ||
        withdrawTxError?.message ||
        "Withdraw transaction failed";
      setError(errorMessage);
      setIsWithdrawing(false);
      console.error("❌ Withdraw error:", writeError || withdrawTxError);
    }
  }, [writeError, withdrawTxError]);

  // Handle withdraw
  const handleWithdraw = useCallback(async () => {
    if (!channelId) {
      console.error("Missing channelId for withdraw");
      setError("Channel ID is required");
      return;
    }

    if (!channelTargetContract) {
      console.error("Missing targetContract for withdraw");
      setError("Target contract not found. Please wait for channel info to load.");
      return;
    }

    if (!address) {
      console.error("Missing user address for withdraw");
      setError("Please connect your wallet");
      return;
    }

    console.log("🚀 Starting withdraw...", {
      channelId: channelId,
      targetContract: channelTargetContract,
    });

    setIsWithdrawing(true);
    setError(null);

    try {
      // Convert channelId to bytes32 format (contract expects bytes32)
      const channelIdBytes32 = toBytes32(channelId);
      if (!channelIdBytes32) {
        throw new Error("Invalid channel ID");
      }

      console.log("📝 Withdraw params:", {
        channelId: channelIdBytes32,
        targetContract: channelTargetContract,
      });

      writeWithdraw({
        functionName: "withdraw",
        args: [channelIdBytes32, channelTargetContract],
      });

      console.log("✅ Withdraw transaction sent");
    } catch (error) {
      console.error("❌ Error withdrawing:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Withdraw transaction failed"
      );
      setIsWithdrawing(false);
    }
  }, [
    channelId,
    channelTargetContract,
    address,
    writeWithdraw,
  ]);

  return {
    handleWithdraw,
    isWithdrawing: isWithdrawing || isWaitingWithdraw || isWithdrawPending,
    withdrawTxHash,
    withdrawSuccess,
    error: error || writeError?.message || withdrawTxError?.message || null,
    channelTargetContract,
  };
}
