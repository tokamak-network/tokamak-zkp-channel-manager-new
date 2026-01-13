/**
 * Custom Hook: Deposit
 *
 * Handles deposit transaction flow and state management
 */

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useDepositStore } from "@/stores";
import { parseInputAmount } from "@/lib/utils/format";
import {
  useBridgeDepositManagerWrite,
  useBridgeDepositManagerWaitForReceipt,
} from "@/hooks/contract";

interface UseDepositParams {
  channelId: bigint | null;
  depositAmount: string;
  mptKey: string;
  needsApproval: boolean;
  approvalSuccess: boolean;
}

/**
 * Hook for managing deposit transactions
 */
export function useDeposit({
  channelId,
  depositAmount,
  mptKey,
  needsApproval,
  approvalSuccess,
}: UseDepositParams) {
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
    if (depositSuccess && depositTxHash && channelId && address) {
      const amount = parseInputAmount(depositAmount);
      setDeposit(address.toLowerCase(), {
        amount,
        mptKey,
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
    mptKey,
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
    if (!depositAmount || !mptKey || !channelId || !address) {
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
      mptKey,
    });

    setDepositing(true);
    setDepositError(null);

    try {
      const amount = parseInputAmount(depositAmount);
      const mptKeyBytes32 = mptKey as `0x${string}`;

      await writeDeposit({
        functionName: "depositToken",
        args: [channelId, amount, mptKeyBytes32],
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
    mptKey,
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
