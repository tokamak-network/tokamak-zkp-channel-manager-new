/**
 * Custom Hook: useDeposit
 *
 * Handles deposit transaction flow and state management
 * Updated for multi-token support with MPT keys array
 */

import { useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useDepositStore } from "@/stores/useDepositStore";
import { toBytes32 } from "@/lib/channelId";
import {
  useBridgeDepositManagerWrite,
  useBridgeDepositManagerWaitForReceipt,
} from "@/hooks/contract";

interface UseDepositParams {
  channelId: string | null;
  depositAmount: string;
  /** Array of MPT keys for multi-token support */
  mptKeys: string[] | null;
  /** @deprecated Use mptKeys instead. Single MPT key for backward compatibility */
  mptKey?: string | null;
  needsApproval: boolean;
  approvalSuccess: boolean;
  tokenDecimals: number;
  onDepositSuccess?: () => void;
}

/**
 * Hook for managing deposit transactions
 */
export function useDeposit({
  channelId,
  depositAmount,
  mptKeys,
  mptKey,
  needsApproval,
  approvalSuccess,
  tokenDecimals,
  onDepositSuccess,
}: UseDepositParams) {
  // Use mptKeys if provided, otherwise convert single mptKey to array for backward compatibility
  const effectiveMptKeys = mptKeys || (mptKey ? [mptKey] : null);
  const { address } = useAccount();
  const {
    setDeposit,
    setDepositing,
    setDepositTxHash,
    setDepositError,
  } = useDepositStore();

  // Prepare deposit transaction (address and abi are pre-configured)
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
    error: depositWriteError,
  } = useBridgeDepositManagerWrite();

  const {
    isLoading: isWaitingDeposit,
    isSuccess: depositSuccess,
    error: depositTxError,
  } = useBridgeDepositManagerWaitForReceipt({
    hash: depositTxHash,
    query: {
      enabled: !!depositTxHash,
    },
  });

  // Ref to track already handled deposit tx hash (prevent duplicate handling)
  const handledTxHashRef = useRef<string | null>(null);

  // Update depositing state
  useEffect(() => {
    setDepositing(isWaitingDeposit || isDepositPending);
  }, [isWaitingDeposit, isDepositPending, setDepositing]);

  // Update deposit tx hash
  useEffect(() => {
    if (depositTxHash) {
      setDepositTxHash(depositTxHash);
    }
  }, [depositTxHash, setDepositTxHash]);

  // Handle deposit success
  useEffect(() => {
    // Prevent duplicate handling of the same tx
    if (
      depositSuccess &&
      depositTxHash &&
      channelId &&
      address &&
      effectiveMptKeys &&
      effectiveMptKeys.length > 0 &&
      handledTxHashRef.current !== depositTxHash
    ) {
      // Mark as handled to prevent re-running
      handledTxHashRef.current = depositTxHash;

      const amount = parseUnits(depositAmount, tokenDecimals);
      setDeposit(address.toLowerCase(), {
        amount,
        mptKey: effectiveMptKeys[0], // Store first key for backward compatibility
        mptKeys: effectiveMptKeys,
        completed: true,
        txHash: depositTxHash,
      });
      setDepositing(false);
      console.log("✅ Deposit completed successfully:", depositTxHash);
      
      // Call callback to refetch allowance after deposit
      if (onDepositSuccess) {
        onDepositSuccess();
      }
    }
  }, [
    depositSuccess,
    depositTxHash,
    channelId,
    address,
    depositAmount,
    effectiveMptKeys,
    tokenDecimals,
    setDeposit,
    setDepositing,
    onDepositSuccess,
  ]);

  // Handle deposit write error (e.g., user rejected in MetaMask)
  useEffect(() => {
    if (depositWriteError) {
      setDepositError(
        depositWriteError.message || "Deposit transaction rejected"
      );
      setDepositing(false);
      console.error("❌ Deposit write error:", depositWriteError);
    }
  }, [depositWriteError, setDepositError, setDepositing]);

  // Handle deposit transaction error (after submission)
  useEffect(() => {
    if (depositTxError) {
      setDepositError(
        depositTxError.message || "Deposit transaction failed"
      );
      setDepositing(false);
      console.error("❌ Deposit tx error:", depositTxError);
    }
  }, [depositTxError, setDepositError, setDepositing]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!depositAmount || !effectiveMptKeys || effectiveMptKeys.length === 0 || !channelId || !address) {
      console.error("Missing required fields for deposit", {
        depositAmount,
        mptKeys: effectiveMptKeys,
        channelId,
        address,
      });
      setDepositError("Missing required fields for deposit");
      return;
    }

    if (needsApproval && !approvalSuccess) {
      console.error("Approval required before deposit");
      setDepositError("Please approve token spending first");
      return;
    }

    console.log("🚀 Starting deposit...", {
      channelId: channelId,
      amount: depositAmount,
      mptKeys: effectiveMptKeys,
    });

    setDepositing(true);
    setDepositError(null);

    try {
      const amount = parseUnits(depositAmount, tokenDecimals);
      
      // Convert channelId to bytes32 format (contract expects bytes32)
      const channelIdBytes32 = toBytes32(channelId);
      if (!channelIdBytes32) {
        throw new Error("Invalid channel ID");
      }
      
      // Convert MPT keys to bytes32 array
      const mptKeysBytes32 = effectiveMptKeys.map(key => key as `0x${string}`);

      console.log("📝 Deposit params:", {
        channelId: channelIdBytes32,
        amount: amount.toString(),
        mptKeys: mptKeysBytes32,
      });

      writeDeposit({
        functionName: "depositToken",
        args: [channelIdBytes32, amount, mptKeysBytes32],
      });

      console.log("✅ Deposit transaction sent");
    } catch (error) {
      console.error("❌ Error depositing token:", error);
      setDepositError(
        error instanceof Error
          ? error.message
          : "Deposit transaction failed"
      );
      setDepositing(false);
    }
  }, [
    depositAmount,
    effectiveMptKeys,
    channelId,
    address,
    needsApproval,
    approvalSuccess,
    tokenDecimals,
    writeDeposit,
    setDepositing,
    setDepositError,
  ]);

  return {
    handleDeposit,
    isDepositing: isWaitingDeposit || isDepositPending,
    depositTxHash,
    depositError: depositTxError,
  };
}
