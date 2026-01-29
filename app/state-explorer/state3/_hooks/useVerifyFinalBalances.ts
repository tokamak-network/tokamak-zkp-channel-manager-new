/**
 * Hook for verifying final balances and closing channel
 *
 * Calls updateValidatedUserStorage() to move channel from state 3 (Closing) to closed state
 * Note: In the new contract, "Closed" state (4) is removed. Channels are cleaned up after closing.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
} from "@/hooks/contract";

interface ChannelFinalizationProof {
  pA: [bigint, bigint, bigint, bigint];
  pB: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  pC: [bigint, bigint, bigint, bigint];
}

interface UseVerifyFinalBalancesParams {
  channelId: `0x${string}` | null;
  /**
   * Final slot values for each participant (2D array for multi-token support)
   * finalSlotValues[participantIndex][slotIndex]
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

export function useVerifyFinalBalances({
  channelId,
  finalSlotValues,
  finalBalances,
  permutation,
  proof,
}: UseVerifyFinalBalancesParams) {
  // Convert finalBalances to finalSlotValues format for backward compatibility
  const effectiveSlotValues = finalSlotValues || (finalBalances ? finalBalances.map(b => [b]) : undefined);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Contract write hook
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useBridgeProofManagerWrite();

  // Wait for transaction receipt
  const {
    isLoading: isWaitingReceipt,
    isSuccess: isTransactionSuccess,
    error: receiptError,
  } = useBridgeProofManagerWaitForReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  // Update processing state
  useEffect(() => {
    setIsProcessing(isWritePending || isWaitingReceipt);
  }, [isWritePending, isWaitingReceipt]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMessage =
        writeError instanceof Error
          ? writeError.message
          : "Failed to verify final balances";
      setError(errorMessage);
      console.error("❌ Verify final balances write error:", writeError);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      const errorMessage =
        receiptError instanceof Error
          ? receiptError.message
          : "Transaction failed";
      setError(errorMessage);
      console.error("❌ Verify final balances receipt error:", receiptError);
    }
  }, [receiptError]);

  // Clear error when starting new operation
  useEffect(() => {
    if (isWritePending || isWaitingReceipt) {
      setError(null);
    }
  }, [isWritePending, isWaitingReceipt]);

  /**
   * Verify final balances and close channel by calling updateValidatedUserStorage
   *
   * @param params - Optional override parameters
   */
  const verifyFinalBalances = useCallback(
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
        setError("Final slot values are required to verify final balances");
        return;
      }

      if (!perm || perm.length === 0) {
        setError("Permutation is required to verify final balances");
        return;
      }

      if (!proofData) {
        setError("Groth16 proof is required to verify final balances");
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        console.log("🚀 Verifying final balances with updateValidatedUserStorage...", {
          channelId,
          channelIdLength: channelId.length,
          finalSlotValues: slotValues.map((sv) => sv.map((v) => v.toString())),
          finalSlotValuesLength: slotValues.length,
          permutation: perm.map((p) => p.toString()),
          permutationLength: perm.length,
          proof: {
            pA: proofData.pA.map((p) => p.toString()),
            pB: proofData.pB.map((p) => p.toString()),
            pC: proofData.pC.map((p) => p.toString()),
          },
        });

        // Debug: Log the exact args that will be sent to the contract
        console.log("📋 Contract call args breakdown:", {
          arg0_channelId: channelId,
          arg1_finalSlotValues: `[${slotValues.slice(0, 3).map((sv) => `[${sv.join(", ")}]`).join(", ")}${slotValues.length > 3 ? "..." : ""}] (length: ${slotValues.length})`,
          arg2_permutation: `[${perm.slice(0, 10).map((p) => p.toString()).join(", ")}${perm.length > 10 ? "..." : ""}] (length: ${perm.length})`,
          arg3_proof: {
            pA_length: proofData.pA.length,
            pB_length: proofData.pB.length,
            pC_length: proofData.pC.length,
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

        // Convert channelId to bytes32 format (ABI expects bytes32)
        let channelIdBytes32: `0x${string}`;
        if (channelId.startsWith("0x")) {
          channelIdBytes32 = channelId as `0x${string}`;
        } else {
          const bigIntValue = BigInt(channelId);
          const hexValue = bigIntValue.toString(16).padStart(64, "0");
          channelIdBytes32 = `0x${hexValue}` as `0x${string}`;
        }

        writeContract({
          functionName: "updateValidatedUserStorage",
          args: [channelIdBytes32, slotValues, perm, proofStruct],
        });

        console.log("✅ Verify final balances transaction submitted");
      } catch (err) {
        console.error("❌ Error verifying final balances:", err);
        if (err instanceof Error) {
          let errorMessage = err.message;
          if (err.message.includes("execution reverted")) {
            const match = err.message.match(/execution reverted: (.+)/);
            if (match) {
              errorMessage = match[1];
            }
          }
          setError(errorMessage);
        } else {
          setError("Failed to verify final balances. Please try again.");
        }
        setIsProcessing(false);
      }
    },
    [channelId, effectiveSlotValues, permutation, proof, writeContract]
  );

  return {
    verifyFinalBalances,
    isProcessing,
    isWritePending,
    isWaitingReceipt,
    isTransactionSuccess,
    txHash,
    error,
  };
}
