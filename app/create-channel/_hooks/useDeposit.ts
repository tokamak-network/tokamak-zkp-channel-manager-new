/**
 * Custom Hook: Deposit
 *
 * Handles deposit transaction flow and state management
 * Updated for multi-token support with MPT keys array
 */

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useDepositStore } from "@/stores";
import { parseInputAmount } from "@/lib/utils/format";
import { toBytes32 } from "@/lib/channelId";
import {
  useBridgeDepositManagerWrite,
  useBridgeDepositManagerWaitForReceipt,
} from "@/hooks/contract";

interface UseDepositParams {
  channelId: bigint | null;
  depositAmount: string;
  /** Array of MPT keys for multi-token support */
  mptKeys: string[];
  /** @deprecated Use mptKeys instead. Single MPT key for backward compatibility */
  mptKey?: string;
  needsApproval: boolean;
  approvalSuccess: boolean;
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
}: UseDepositParams) {
  // Use mptKeys if provided, otherwise convert single mptKey to array for backward compatibility
  const effectiveMptKeys = mptKeys.length > 0 ? mptKeys : (mptKey ? [mptKey] : []);
  const { address } = useAccount();
  const {
    setDeposit,
    setDepositing,
    setDepositTxHash,
    setDepositError,
  } = useDepositStore();

  // Prepare deposit transaction (address and abi are pre-configured)
  const { writeContract: writeDeposit, data: depositTxHash } =
    useBridgeDepositManagerWrite();
  const {
    isLoading: isWaitingDeposit,
    isSuccess: depositSuccess,
    error: depositTxError,
  } = useBridgeDepositManagerWaitForReceipt({
    hash: depositTxHash,
  });

  // Update depositing state
  useEffect(() => {
    setDepositing(isWaitingDeposit);
  }, [isWaitingDeposit, setDepositing]);

  // Update deposit tx hash
  useEffect(() => {
    if (depositTxHash) {
      setDepositTxHash(depositTxHash);
    }
  }, [depositTxHash, setDepositTxHash]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && depositTxHash && channelId && address && effectiveMptKeys.length > 0) {
      const amount = parseInputAmount(depositAmount);
      setDeposit(address.toLowerCase(), {
        amount,
        mptKey: effectiveMptKeys[0], // First key for backward compatibility
        mptKeys: effectiveMptKeys,
        completed: true,
        txHash: depositTxHash,
      });
      setDepositing(false);
      console.log("✅ Deposit completed successfully:", depositTxHash);
    }
  }, [
    depositSuccess,
    depositTxHash,
    channelId,
    address,
    depositAmount,
    effectiveMptKeys,
    setDeposit,
    setDepositing,
  ]);

  // Handle deposit error
  useEffect(() => {
    if (depositTxError) {
      setDepositError(
        depositTxError.message || "Deposit transaction failed"
      );
      setDepositing(false);
      console.error("❌ Deposit error:", depositTxError);
    }
  }, [depositTxError, setDepositError, setDepositing]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!depositAmount || effectiveMptKeys.length === 0 || !channelId || !address) {
      console.error("Missing required fields for deposit");
      return;
    }

    if (needsApproval && !approvalSuccess) {
      console.error("Approval required before deposit");
      setDepositError("Please approve token spending first");
      return;
    }

    console.log("Depositing...", {
      channelId: channelId.toString(),
      amount: depositAmount,
      mptKeys: effectiveMptKeys,
    });

    setDepositing(true);
    setDepositError(null);

    try {
      const amount = parseInputAmount(depositAmount);
      
      // Convert channelId to bytes32 format (contract expects bytes32)
      const channelIdBytes32 = toBytes32(channelId);
      if (!channelIdBytes32) {
        throw new Error("Invalid channel ID");
      }
      
      // Convert MPT keys to bytes32 array
      const mptKeysBytes32 = effectiveMptKeys.map(key => key as `0x${string}`);

      writeDeposit({
        functionName: "depositToken",
        args: [channelIdBytes32, amount, mptKeysBytes32],
      });
    } catch (error) {
      console.error("Error depositing token:", error);
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
    writeDeposit,
    setDepositing,
    setDepositError,
  ]);

  return {
    handleDeposit,
    isDepositing: isWaitingDeposit,
    depositTxHash,
    depositError: depositTxError,
  };
}
