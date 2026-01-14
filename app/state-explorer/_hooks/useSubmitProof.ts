/**
 * Hook for submitting verified proofs to the contract
 *
 * Automatically formats verified proofs from DB and submits them via submitProofAndSignature
 */

import { useState, useCallback } from "react";
import {
  formatVerifiedProofsForSubmission,
  loadProofFromFilePath,
  type FormattedProofForSubmission,
} from "../_utils/proofFormatter";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
} from "@/hooks/contract";

interface VerifiedProof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  zipFile: {
    filePath: string;
    fileName: string;
    size: number;
  };
  verifiedAt: string;
  verifiedBy: string;
}

export function useSubmitProof(channelId: string | null) {
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedProofs, setFormattedProofs] =
    useState<FormattedProofForSubmission | null>(null);
  const [verifiedProofsList, setVerifiedProofsList] = useState<VerifiedProof[]>(
    []
  );

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

  /**
   * Load verified proofs from DB and format them for submission
   */
  const loadAndFormatProofs = useCallback(async () => {
    if (!channelId) {
      throw new Error("Channel ID is required");
    }

    setIsLoadingProofs(true);
    setError(null);

    try {
      // Fetch verified proofs from DB
      const response = await fetch(
        `/api/channels/${channelId}/proofs?type=verified`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "No verified proofs available");
      }

      // API returns array directly, but handle both array and object formats
      let proofsArray: VerifiedProof[] = [];
      if (Array.isArray(data.data)) {
        proofsArray = data.data;
      } else if (data.data && typeof data.data === "object") {
        // Convert object to array
        proofsArray = Object.entries(data.data).map(
          ([key, value]: [string, any]) => ({
            key,
            ...value,
          })
        );
      }

      // Sort by sequence number
      proofsArray.sort(
        (a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
      );

      if (proofsArray.length === 0) {
        throw new Error("No verified proofs found");
      }

      // Load proof ZIP files
      const proofBlobs: Blob[] = [];
      for (const proof of proofsArray) {
        // Use proof.key directly (same as useProofActions.ts)
        const proofId = proof.key;
        if (!proofId) {
          throw new Error(`Proof has no key: ${JSON.stringify(proof)}`);
        }

        // Use get-proof-zip API with channelId and proofId
        const apiUrl = `/api/get-proof-zip?channelId=${encodeURIComponent(
          channelId
        )}&proofId=${encodeURIComponent(
          proofId
        )}&status=verifiedProofs&format=binary`;

        const zipResponse = await fetch(apiUrl);
        if (!zipResponse.ok) {
          // Get error details from response
          let errorDetails = `HTTP ${zipResponse.status}`;
          try {
            const errorData = await zipResponse.json();
            errorDetails = errorData.error || errorData.details || errorDetails;
          } catch {
            // If response is not JSON, use status text
            errorDetails = zipResponse.statusText || errorDetails;
          }
          throw new Error(
            `Failed to load proof file: ${proofId} (${errorDetails})`
          );
        }
        const blob = await zipResponse.blob();
        proofBlobs.push(blob);
      }

      // Format proofs for contract submission
      const formatted = await formatVerifiedProofsForSubmission(
        proofBlobs,
        channelId
      );
      setFormattedProofs(formatted);
      setVerifiedProofsList(proofsArray);

      return formatted;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load proofs";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoadingProofs(false);
    }
  }, [channelId]);

  /**
   * Submit proofs to the contract
   */
  const submitProofs = useCallback(async () => {
    if (!formattedProofs || !channelId) {
      setError(
        "No proofs loaded or channel ID missing. Call loadAndFormatProofs first."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare signature (empty signature for now - can be extended later)
      const signature = {
        message:
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        rx: BigInt(0),
        ry: BigInt(0),
        z: BigInt(0),
      };

      // Call submitProofAndSignature
      if (!channelId) {
        throw new Error("Channel ID is required");
      }

      writeContract({
        functionName: "submitProofAndSignature",
        args: [BigInt(channelId), formattedProofs.proofData, signature],
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit proofs";
      setError(errorMessage);
      setIsSubmitting(false);
      throw err;
    }
  }, [formattedProofs, channelId, writeContract]);

  // Update submitting state based on transaction status
  const isSubmittingTransaction =
    isWritePending || isWaitingReceipt || isSubmitting;

  // Update error state
  const transactionError = writeError || receiptError;

  return {
    loadAndFormatProofs,
    submitProofs,
    isLoadingProofs,
    isSubmitting: isSubmittingTransaction,
    isTransactionSuccess,
    error: error || (transactionError ? transactionError.message : null),
    formattedProofs,
    verifiedProofsList,
    txHash,
  };
}
