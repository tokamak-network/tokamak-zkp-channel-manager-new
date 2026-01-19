"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
} from "@/hooks/contract";
import { useGenerateInitialProof } from "./useGenerateInitialProof";
import type { ProofData } from "@/stores/useInitializeStore";

interface UseInitializeStateParams {
  channelId: `0x${string}` | null;
}

export function useInitializeState({ channelId }: UseInitializeStateParams) {
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Proof generation hook
  const {
    generateProof,
    isGenerating: isGeneratingProof,
    isLoadingChannelData,
    status: proofStatus,
    error: proofError,
  } = useGenerateInitialProof({ channelId });

  // Prepare initialize transaction (address and abi are pre-configured)
  const {
    writeContract: writeInitialize,
    data: initializeTxHash,
    isPending: isWriting,
    error: writeError,
  } = useBridgeProofManagerWrite();

  const {
    isLoading: isWaiting,
    isSuccess: initializeSuccess,
    error: waitError,
  } = useBridgeProofManagerWaitForReceipt({
    hash: initializeTxHash,
    query: {
      enabled: !!initializeTxHash,
      retry: true,
    },
  });

  // Update error state and reset processing on error
  useEffect(() => {
    if (proofError) {
      setError(proofError);
      setIsProcessing(false);
    } else if (writeError) {
      setError(writeError.message);
      setIsProcessing(false);
    } else if (waitError) {
      setError(waitError.message);
      setIsProcessing(false);
    } else {
      setError(null);
    }
  }, [proofError, writeError, waitError]);

  // Handle successful initialization and save to DB
  useEffect(() => {
    if (initializeSuccess && initializeTxHash && channelId) {
      setIsProcessing(false);
      console.log("✅ Channel initialized successfully:", initializeTxHash);

      // Save initialization transaction hash to DB
      fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initializationTxHash: initializeTxHash,
          initializedAt: new Date().toISOString(),
          status: "active", // Update status to active after initialization
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("✅ Initialization transaction hash saved to DB");
          } else {
            console.error(
              "❌ Failed to save initialization tx hash:",
              data.error
            );
          }
        })
        .catch((error) => {
          console.error("❌ Error saving initialization tx hash:", error);
        });
    }
  }, [initializeSuccess, initializeTxHash, channelId]);

  // Initialize state function
  const initializeState = useCallback(async () => {
    if (!channelId) {
      setError("Channel ID is required");
      return;
    }

    if (isLoadingChannelData) {
      setError("Channel data is still loading. Please wait...");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProofData(null);

    try {
      // Step 1: Generate proof
      const proof = await generateProof();
      if (!proof) {
        throw new Error("Failed to generate proof");
      }
      setProofData(proof);

      // Step 2: Call contract
      // Ensure all proof values are bigint (not string)
      const proofStruct = {
        pA: proof.pA.map((val) =>
          typeof val === "string" ? BigInt(val) : val
        ) as [bigint, bigint, bigint, bigint],
        pB: proof.pB.map((val) =>
          typeof val === "string" ? BigInt(val) : val
        ) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        pC: proof.pC.map((val) =>
          typeof val === "string" ? BigInt(val) : val
        ) as [bigint, bigint, bigint, bigint],
        merkleRoot: proof.merkleRoot as `0x${string}`,
      };

      console.log("🔍 Calling initializeChannelState:", {
        channelId,
        proofStruct: {
          pA: proofStruct.pA.map((v) => v.toString()),
          pB: proofStruct.pB.map((v) => v.toString()),
          pC: proofStruct.pC.map((v) => v.toString()),
          merkleRoot: proofStruct.merkleRoot,
        },
      });

      writeInitialize({
        functionName: "initializeChannelState",
        args: [channelId, proofStruct],
      });
    } catch (err) {
      console.error("Error initializing state:", err);

      // Extract detailed error message
      let errorMessage = "Failed to initialize state";
      if (err instanceof Error) {
        errorMessage = err.message;

        // Try to extract revert reason from viem error
        if (err.message.includes("revert")) {
          const revertMatch = err.message.match(/revert\s+(.+)/i);
          if (revertMatch) {
            errorMessage = `Contract reverted: ${revertMatch[1]}`;
          }
        }

        // Check for specific error types
        if (err.message.includes("execution reverted")) {
          const reasonMatch = err.message.match(
            /execution reverted(?:.*?reason="([^"]+)")?/i
          );
          if (reasonMatch && reasonMatch[1]) {
            errorMessage = `Contract reverted: ${reasonMatch[1]}`;
          } else {
            errorMessage =
              "Contract execution reverted. Please check channel state and permissions.";
          }
        }
      }

      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [channelId, isLoadingChannelData, generateProof, writeInitialize]);

  return {
    initializeState,
    isProcessing: isProcessing || isGeneratingProof || isWriting || isWaiting,
    isGeneratingProof,
    isLoadingChannelData,
    isWriting,
    isWaiting,
    initializeSuccess,
    initializeTxHash,
    proofStatus,
    error,
  };
}
