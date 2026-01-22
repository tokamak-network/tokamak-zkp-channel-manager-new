/**
 * Custom Hook: useIntegratedDeposit
 *
 * Combines MPT key generation and deposit into a single integrated flow.
 * Flow: Amount input -> Click Deposit -> Sign for MPT key -> Sign for Deposit
 */

import { useCallback, useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { parseUnits } from "viem";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { deriveL2KeysAndAddressFromSignature } from "@/lib/tokamakl2js";
import { toBytes32 } from "@/lib/channelId";
import {
  useBridgeDepositManagerWrite,
  useBridgeDepositManagerWaitForReceipt,
} from "@/hooks/contract";

export type DepositStep =
  | "idle"
  | "signing_mpt" // Step 1: Signing for MPT key generation
  | "mpt_generated" // MPT key generated, ready for deposit
  | "signing_deposit" // Step 2: Signing deposit transaction
  | "confirming" // Waiting for transaction confirmation
  | "completed" // Deposit completed
  | "error"; // Error occurred

interface UseIntegratedDepositParams {
  channelId: string | null;
  depositAmount: string;
  tokenDecimals: number;
  onDepositSuccess?: () => void;
}

interface UseIntegratedDepositReturn {
  /** Start the integrated deposit flow */
  startDeposit: () => Promise<void>;
  /** Current step in the flow */
  currentStep: DepositStep;
  /** Generated MPT key */
  mptKey: `0x${string}` | null;
  /** Whether any operation is in progress */
  isProcessing: boolean;
  /** Error message if any */
  error: string | null;
  /** Deposit transaction hash */
  txHash: `0x${string}` | undefined;
  /** Reset the flow state */
  reset: () => void;
}

/**
 * Integrated deposit hook that combines MPT key generation and deposit
 */
export function useIntegratedDeposit({
  channelId,
  depositAmount,
  tokenDecimals,
  onDepositSuccess,
}: UseIntegratedDepositParams): UseIntegratedDepositReturn {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [currentStep, setCurrentStep] = useState<DepositStep>("idle");
  const [mptKey, setMptKey] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Deposit transaction hooks
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
    error: depositWriteError,
    reset: resetDepositWrite,
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

  // Move to "confirming" step when tx hash is received (user signed in MetaMask)
  useEffect(() => {
    if (depositTxHash && currentStep === "signing_deposit") {
      setCurrentStep("confirming");
      console.log("✅ [Step 2] Transaction signed, waiting for confirmation...");
    }
  }, [depositTxHash, currentStep]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && currentStep === "confirming") {
      setCurrentStep("completed");
      if (onDepositSuccess) {
        onDepositSuccess();
      }
    }
  }, [depositSuccess, currentStep, onDepositSuccess]);

  // Handle deposit errors
  useEffect(() => {
    if ((depositWriteError || depositTxError) && currentStep !== "error" && currentStep !== "idle") {
      setCurrentStep("error");
      setError(
        depositWriteError?.message ||
          depositTxError?.message ||
          "Deposit transaction failed"
      );
    }
  }, [depositWriteError, depositTxError, currentStep]);

  const reset = useCallback(() => {
    setCurrentStep("idle");
    setMptKey(null);
    setError(null);
    resetDepositWrite();
  }, [resetDepositWrite]);

  const startDeposit = useCallback(async () => {
    // Validation
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      setCurrentStep("error");
      return;
    }

    if (!channelId) {
      setError("Channel ID is required");
      setCurrentStep("error");
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) < 0) {
      setError("Please enter a valid deposit amount");
      setCurrentStep("error");
      return;
    }

    setError(null);

    try {
      // ========================================
      // Step 1: Generate MPT Key (First Signature)
      // ========================================
      setCurrentStep("signing_mpt");

      const message = L2_PRV_KEY_MESSAGE + channelId.toString();
      console.log("📝 [Step 1] Signing for MPT key generation...");

      const signature = await signMessageAsync({ message });
      console.log("✅ [Step 1] Signature received");

      // Generate MPT key from signature
      const accountL2 = deriveL2KeysAndAddressFromSignature(signature, 0);
      const generatedMptKey = accountL2.mptKey;
      setMptKey(generatedMptKey);
      console.log("✅ [Step 1] MPT key generated:", generatedMptKey);

      setCurrentStep("mpt_generated");

      // ========================================
      // Step 2: Execute Deposit (Second Signature)
      // ========================================
      setCurrentStep("signing_deposit");
      console.log("📝 [Step 2] Executing deposit transaction...");

      const amount = parseUnits(depositAmount, tokenDecimals);
      const channelIdBytes32 = toBytes32(channelId);
      if (!channelIdBytes32) {
        throw new Error("Invalid channel ID");
      }

      // This triggers MetaMask popup - step changes to "confirming" when txHash is received
      writeDeposit({
        functionName: "depositToken",
        args: [channelIdBytes32, amount, generatedMptKey],
      });
      // Don't set "confirming" here - wait for depositTxHash in useEffect
    } catch (err) {
      console.error("❌ Error in deposit flow:", err);

      if (err instanceof Error) {
        if (
          err.message.includes("User rejected") ||
          err.message.includes("rejected")
        ) {
          setError("Transaction cancelled by user");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred");
      }

      setCurrentStep("error");
    }
  }, [
    isConnected,
    address,
    channelId,
    depositAmount,
    tokenDecimals,
    signMessageAsync,
    writeDeposit,
  ]);

  const isProcessing =
    currentStep === "signing_mpt" ||
    currentStep === "signing_deposit" ||
    currentStep === "confirming" ||
    isDepositPending ||
    isWaitingDeposit;

  return {
    startDeposit,
    currentStep,
    mptKey,
    isProcessing,
    error,
    txHash: depositTxHash,
    reset,
  };
}
