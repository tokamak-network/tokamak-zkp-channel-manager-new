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

  // Handle successful initialization
  useEffect(() => {
    if (initializeSuccess && initializeTxHash) {
      setIsProcessing(false);
    }
  }, [initializeSuccess, initializeTxHash]);

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
      const proofStruct = {
        pA: proof.pA,
        pB: proof.pB,
        pC: proof.pC,
        merkleRoot: proof.merkleRoot as `0x${string}`,
      };

      await writeInitialize({
        address: proofManagerAddress,
        abi: proofManagerAbi,
        functionName: "initializeChannelState",
        args: [channelId, proofStruct],
      });
    } catch (err) {
      console.error("Error initializing state:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize state"
      );
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
