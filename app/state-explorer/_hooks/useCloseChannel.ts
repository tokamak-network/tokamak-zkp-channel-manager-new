/**
 * Custom Hook: Close Channel
 *
 * Handles closing a channel by calling updateValidatedUserStorage
 * This requires final slot values (2D array for multi-token), permutation, and a Groth16 proof
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
} from "@/hooks/contract";

export type CloseChannelStep =
  | "idle"
  | "signing"
  | "confirming"
  | "completed"
  | "error";

interface ChannelFinalizationProof {
  pA: [bigint, bigint, bigint, bigint];
  pB: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  pC: [bigint, bigint, bigint, bigint];
}

interface UseCloseChannelParams {
  channelId: `0x${string}` | null;
  /**
   * Final slot values for each participant (2D array for multi-token support)
   * finalSlotValues[participantIndex][slotIndex]
   * For single-token, this would be [[balance1], [balance2], ...]
   */
  finalSlotValues?: bigint[][];
  /**
   * @deprecated Use finalSlotValues instead. Final balances for backward compatibility.
   */
  finalBalances?: bigint[];
  /**
   * Permutation array for final balances
   * Maps participant indices to final balance indices
   */
  permutation?: bigint[];
  /**
   * Groth16 proof for final balances verification
   */
  proof?: ChannelFinalizationProof;
}

export function useCloseChannel({
  channelId,
  finalSlotValues,
  finalBalances,
  permutation,
  proof,
}: UseCloseChannelParams) {
  // Convert finalBalances to finalSlotValues format for backward compatibility
  const effectiveSlotValues = finalSlotValues || (finalBalances ? finalBalances.map(b => [b]) : undefined);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<CloseChannelStep>("idle");

  // Prepare close channel transaction (address and abi are pre-configured)
  const {
    writeContract: writeCloseChannel,
    data: closeTxHash,
    isPending: isWriting,
    error: writeError,
  } = useBridgeProofManagerWrite();

  const {
    isLoading: isWaiting,
    isSuccess: closeSuccess,
    error: waitError,
  } = useBridgeProofManagerWaitForReceipt({
    hash: closeTxHash,
    query: {
      enabled: !!closeTxHash,
      retry: true,
    },
  });

  // Update processing state and step for signing
  useEffect(() => {
    setIsProcessing(isWriting || isWaiting);
    // When pending signature, move to signing step
    if (isWriting && currentStep === "idle") {
      setCurrentStep("signing");
    }
  }, [isWriting, isWaiting, currentStep]);

  // When txHash is received, user has signed - move to confirming step
  useEffect(() => {
    if (closeTxHash && currentStep === "signing") {
      setCurrentStep("confirming");
    }
  }, [closeTxHash, currentStep]);

  // Handle success
  useEffect(() => {
    if (closeSuccess && currentStep === "confirming") {
      setCurrentStep("completed");
    }
  }, [closeSuccess, currentStep]);

  // Handle errors and reset processing state
  useEffect(() => {
    if (writeError) {
      const errorMessage =
        writeError instanceof Error
          ? writeError.message
          : "Failed to submit close channel transaction";
      setError(errorMessage);
      setIsProcessing(false);
      setCurrentStep("error");
      console.error("❌ Close channel write error:", writeError);
    }
  }, [writeError]);

  useEffect(() => {
    if (waitError) {
      const errorMessage =
        waitError instanceof Error
          ? waitError.message
          : "Close channel transaction failed";
      setError(errorMessage);
      setIsProcessing(false);
      setCurrentStep("error");
      console.error("❌ Close channel wait error:", waitError);
    }
  }, [waitError]);

  // Clear error when starting new operation
  useEffect(() => {
    if (isWriting || isWaiting) {
      setError(null);
    }
  }, [isWriting, isWaiting]);

  /**
   * Close the channel by calling updateValidatedUserStorage
   *
   * @param params - Optional override parameters
   */
  const closeChannel = useCallback(
    async (params?: {
      finalSlotValues?: bigint[][];
      finalBalances?: bigint[];
      permutation?: bigint[];
      proof?: ChannelFinalizationProof;
    }) => {
      if (!channelId) {
        setError("Channel ID is required");
        return;
      }

      // Support both new finalSlotValues and legacy finalBalances
      const slotValues = params?.finalSlotValues || 
        (params?.finalBalances ? params.finalBalances.map(b => [b]) : effectiveSlotValues);
      const perm = params?.permutation || permutation;
      const proofData = params?.proof || proof;

      if (!slotValues || slotValues.length === 0) {
        setError("Final slot values are required to close the channel");
        return;
      }

      if (!perm || perm.length === 0) {
        setError("Permutation is required to close the channel");
        return;
      }

      if (!proofData) {
        setError("Groth16 proof is required to close the channel");
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        console.log("🚀 Closing channel with updateValidatedUserStorage...", {
          channelId,
          finalSlotValues: slotValues.map((sv) => sv.map((v) => v.toString())),
          permutation: perm.map((p) => p.toString()),
          proof: {
            pA: proofData.pA.map((p) => p.toString()),
            pB: proofData.pB.map((p) => p.toString()),
            pC: proofData.pC.map((p) => p.toString()),
          },
        });

        // Convert proof to the format expected by the contract
        const proofStruct = {
          pA: proofData.pA.map((p) => BigInt(p)) as [
            bigint,
            bigint,
            bigint,
            bigint
          ],
          pB: proofData.pB.map((p) => BigInt(p)) as [
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint
          ],
          pC: proofData.pC.map((p) => BigInt(p)) as [
            bigint,
            bigint,
            bigint,
            bigint
          ],
        };

        await writeCloseChannel({
          functionName: "updateValidatedUserStorage",
          args: [channelId as `0x${string}`, slotValues, perm, proofStruct],
        });

        console.log("✅ Close channel transaction submitted");
      } catch (err) {
        console.error("❌ Error closing channel:", err);
        if (err instanceof Error) {
          // Extract more specific error message
          let errorMessage = err.message;
          if (err.message.includes("execution reverted")) {
            const match = err.message.match(/execution reverted: (.+)/);
            if (match) {
              errorMessage = match[1];
            }
          }
          setError(errorMessage);
        } else {
          setError("Failed to close channel. Please try again.");
        }
        setIsProcessing(false);
      }
    },
    [channelId, effectiveSlotValues, permutation, proof, writeCloseChannel]
  );

  // Reset function
  const reset = useCallback(() => {
    setError(null);
    setIsProcessing(false);
    setCurrentStep("idle");
  }, []);

  return {
    closeChannel,
    isProcessing,
    isWriting,
    isWaiting,
    closeSuccess,
    closeTxHash,
    error,
    currentStep,
    reset,
  };
}
