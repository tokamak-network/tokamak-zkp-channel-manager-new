"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
  useBridgeProofManagerAddress,
} from "@/hooks/contract";
import { getContractAbi } from "@tokamak/config";
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
    status: proofStatus,
    error: proofError,
  } = useGenerateInitialProof({ channelId });

  // Get contract address and ABI for BridgeProofManager
  const proofManagerAddress = useBridgeProofManagerAddress();
  const proofManagerAbi = getContractAbi("BridgeProofManager");

  // Prepare initialize transaction
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

  // Update error state
  useEffect(() => {
    if (proofError) {
      setError(proofError);
    } else if (writeError) {
      setError(writeError.message);
    } else if (waitError) {
      setError(waitError.message);
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
        pA: proof.pA.map((val) => (typeof val === "string" ? BigInt(val) : val)) as [
          bigint,
          bigint,
          bigint,
          bigint,
        ],
        pB: proof.pB.map((val) => (typeof val === "string" ? BigInt(val) : val)) as [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ],
        pC: proof.pC.map((val) => (typeof val === "string" ? BigInt(val) : val)) as [
          bigint,
          bigint,
          bigint,
          bigint,
        ],
        merkleRoot: proof.merkleRoot as `0x${string}`,
      };

      console.log("🔍 Calling initializeChannelState:", {
        channelId,
        proofManagerAddress,
        proofStruct: {
          pA: proofStruct.pA.map((v) => v.toString()),
          pB: proofStruct.pB.map((v) => v.toString()),
          pC: proofStruct.pC.map((v) => v.toString()),
          merkleRoot: proofStruct.merkleRoot,
        },
      });

      await writeInitialize({
        address: proofManagerAddress,
        abi: proofManagerAbi,
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
          const reasonMatch = err.message.match(/execution reverted(?:.*?reason="([^"]+)")?/i);
          if (reasonMatch && reasonMatch[1]) {
            errorMessage = `Contract reverted: ${reasonMatch[1]}`;
          } else {
            errorMessage = "Contract execution reverted. Please check channel state and permissions.";
          }
        }
      }
      
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [
    channelId,
    generateProof,
    writeInitialize,
    proofManagerAddress,
    proofManagerAbi,
  ]);

  return {
    initializeState,
    isProcessing: isProcessing || isGeneratingProof || isWriting || isWaiting,
    isGeneratingProof,
    isWriting,
    isWaiting,
    initializeSuccess,
    initializeTxHash,
    proofStatus,
    error,
  };
}
