/**
 * Custom Hook: useDeposit
 *
 * Handles deposit transaction flow and state management
 */

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useDepositStore } from "@/stores/useDepositStore";
import {
  useBridgeDepositManagerWrite,
  useBridgeDepositManagerWaitForReceipt,
  useBridgeDepositManagerAddress,
} from "@/hooks/contract";
import { getContractAbi } from "@tokamak/config";

interface UseDepositParams {
  channelId: string | null;
  depositAmount: string;
  mptKey: string | null;
  needsApproval: boolean;
  approvalSuccess: boolean;
  tokenDecimals: number;
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
  tokenDecimals,
}: UseDepositParams) {
  const { address } = useAccount();
  const {
    setDeposit,
    setDepositing,
    setDepositTxHash,
    setDepositError,
  } = useDepositStore();

  // Get contract address and ABI
  const depositManagerAddress = useBridgeDepositManagerAddress();
  const depositManagerAbi = getContractAbi("BridgeDepositManager");

  // Prepare deposit transaction
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
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
    if (depositSuccess && depositTxHash && channelId && address && mptKey) {
      const amount = parseUnits(depositAmount, tokenDecimals);
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
    tokenDecimals,
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
      console.error("Missing required fields for deposit", {
        depositAmount,
        mptKey,
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
      mptKey,
      depositManagerAddress,
    });

    setDepositing(true);
    setDepositError(null);

    try {
      const amount = parseUnits(depositAmount, tokenDecimals);
      const channelIdBytes32 = channelId as `0x${string}`;
      const mptKeyBytes32 = mptKey as `0x${string}`;

      console.log("📝 Deposit params:", {
        address: depositManagerAddress,
        channelId: channelIdBytes32,
        amount: amount.toString(),
        mptKey: mptKeyBytes32,
      });

      await writeDeposit({
        address: depositManagerAddress,
        abi: depositManagerAbi,
        functionName: "depositToken",
        args: [channelIdBytes32, amount, mptKeyBytes32],
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
    mptKey,
    channelId,
    address,
    needsApproval,
    approvalSuccess,
    tokenDecimals,
    writeDeposit,
    depositManagerAddress,
    depositManagerAbi,
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
