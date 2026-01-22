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

export type WithdrawStep =
  | "idle"
  | "signing"
  | "confirming"
  | "completed"
  | "error";

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
  const [targetContractFromApi, setTargetContractFromApi] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WithdrawStep>("idle");

  // Get targetContract from contract (may be 0x0 after cleanupChannel)
  const { data: targetContractFromContract } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: channelId ? [toBytes32(channelId) as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected,
    },
  });

  // Fetch targetContract from API as fallback (stored in DB, persists after cleanupChannel)
  useEffect(() => {
    const fetchTargetContract = async () => {
      if (!channelId) return;
      
      try {
        const response = await fetch(`/api/channels/${encodeURIComponent(channelId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.targetContract) {
            setTargetContractFromApi(data.data.targetContract);
          }
        }
      } catch (error) {
        console.error("[useWithdraw] Failed to fetch channel from API:", error);
      }
    };

    fetchTargetContract();
  }, [channelId]);

  // Use contract targetContract if valid, otherwise use API fallback
  const channelTargetContract =
    targetContractFromContract &&
    targetContractFromContract !== "0x0000000000000000000000000000000000000000"
      ? (targetContractFromContract as `0x${string}`)
      : (targetContractFromApi as `0x${string}` | null);

  // Get withdrawable amount
  const { data: withdrawableAmount } = useBridgeCoreRead({
    functionName: "getWithdrawableAmount",
    args:
      channelId && address && channelTargetContract
        ? [
            toBytes32(channelId) as `0x${string}`,
            address as `0x${string}`,
            channelTargetContract as `0x${string}`,
          ]
        : undefined,
    query: {
      enabled: !!channelId && !!address && !!channelTargetContract && isConnected,
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

  // Update withdrawing state and step for signing
  useEffect(() => {
    setIsWithdrawing(isWaitingWithdraw || isWithdrawPending);
    // When pending signature, move to signing step
    if (isWithdrawPending && currentStep === "idle") {
      setCurrentStep("signing");
    }
  }, [isWaitingWithdraw, isWithdrawPending, currentStep]);

  // When txHash is received, user has signed - move to confirming step
  useEffect(() => {
    if (withdrawTxHash && currentStep === "signing") {
      setCurrentStep("confirming");
    }
  }, [withdrawTxHash, currentStep]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess && withdrawTxHash) {
      setIsWithdrawing(false);
      setError(null);
      setCurrentStep("completed");
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
      setCurrentStep("error");
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

  // Reset function
  const reset = useCallback(() => {
    setIsWithdrawing(false);
    setError(null);
    setCurrentStep("idle");
  }, []);

  return {
    handleWithdraw,
    isWithdrawing: isWithdrawing || isWaitingWithdraw || isWithdrawPending,
    withdrawTxHash,
    withdrawSuccess,
    error: error || writeError?.message || withdrawTxError?.message || null,
    channelTargetContract,
    withdrawableAmount: withdrawableAmount ? BigInt(withdrawableAmount.toString()) : BigInt(0),
    currentStep,
    reset,
  };
}
