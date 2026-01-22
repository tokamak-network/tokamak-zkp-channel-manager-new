/**
 * Proof Generation Modal
 *
 * Modal for generating ZK proof with step-by-step progress
 * Steps: 1. Signing -> 2. Synthesizer -> 3. Making Proof -> 4. Verify -> Completed
 */

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui";

export type ProofGenerationStep =
  | "idle"
  | "signing"
  | "synthesizer"
  | "making_proof"
  | "verify"
  | "completed"
  | "error";

// Step definitions for progress display
const GENERATION_STEPS = [
  { key: "signing", label: "Signing Transaction" },
  { key: "synthesizer", label: "Running Synthesizer" },
  { key: "making_proof", label: "Generating ZK Proof" },
  { key: "verify", label: "Verifying Proof" },
] as const;

interface ProofGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => Promise<`0x${string}`>; // Returns keySeed
  onGenerateProof: (keySeed: `0x${string}`) => Promise<void>;
  channelId: string;
  recipient: string;
  amount: string;
  tokenSymbol: string;
  currentStep?: ProofGenerationStep; // External step state from SSE
  onStepChange?: (step: ProofGenerationStep) => void; // Callback to update step
}

type ModalState = "confirm" | "processing" | "completed" | "error";

export function ProofGenerationModal({
  isOpen,
  onClose,
  onSign,
  onGenerateProof,
  channelId,
  recipient,
  amount,
  tokenSymbol,
  currentStep: externalStep,
  onStepChange,
}: ProofGenerationModalProps) {
  const [modalState, setModalState] = useState<ModalState>("confirm");
  const [internalStep, setInternalStep] = useState<ProofGenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);

  // Use external step if provided, otherwise use internal
  const currentStep = externalStep ?? internalStep;

  // Update step - either via callback or internal state
  const updateStep = (step: ProofGenerationStep) => {
    if (onStepChange) {
      onStepChange(step);
    } else {
      setInternalStep(step);
    }
  };

  // Update modal state based on external step changes
  useEffect(() => {
    if (externalStep === "completed" && modalState === "processing") {
      setModalState("completed");
    } else if (externalStep === "error" && modalState === "processing") {
      setModalState("error");
    }
  }, [externalStep, modalState]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setModalState("processing");
    updateStep("signing");
    setError(null);

    try {
      // Step 1: Sign with MetaMask
      const keySeed = await onSign();

      // After signing, step will be updated by SSE via onStepChange
      // Steps 2-4: Generate proof (progress updates come via SSE)
      await onGenerateProof(keySeed);

      // If using internal state (no SSE), mark as completed
      if (!onStepChange) {
        updateStep("completed");
        setModalState("completed");
      }
    } catch (err) {
      console.error("Proof generation error:", err);
      updateStep("error");
      setModalState("error");
      setError(err instanceof Error ? err.message : "Failed to generate proof");
    }
  };

  const handleClose = () => {
    if (modalState !== "processing") {
      setModalState("confirm");
      updateStep("idle");
      setError(null);
      onClose();
    }
  };

  // Get current step index for progress display
  const getCurrentStepIndex = () => {
    return GENERATION_STEPS.findIndex((s) => s.key === currentStep);
  };

  // Truncate channel ID for display
  const truncatedChannelId = channelId
    ? `${channelId.slice(0, 8)}...${channelId.slice(-6)}`
    : "";

  // Get description based on current step
  const getStepDescription = () => {
    switch (currentStep) {
      case "signing":
        return "Please sign the transaction in your wallet";
      case "synthesizer":
        return "Running L2 transaction synthesis...";
      case "making_proof":
        return "Generating ZK proof... This may take a few minutes";
      case "verify":
        return "Verifying the generated proof...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl font-mono"
        style={{ width: 480, padding: 32 }}
      >
        {/* Close button - only show when not processing */}
        {modalState !== "processing" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        )}

        {/* Confirm State */}
        {modalState === "confirm" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                Confirm Transaction
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                Please confirm the transaction details below
              </p>
            </div>

            {/* Transaction Details */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Channel ID
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {truncatedChannelId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Recipient
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {amount} {tokenSymbol}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="full"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        )}

        {/* Processing State */}
        {modalState === "processing" && (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-[#2A72E5] animate-spin" />
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                Generating Proof
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                {getStepDescription()}
              </p>
            </div>

            {/* Step Progress */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              {GENERATION_STEPS.map((step, index) => {
                const currentIndex = getCurrentStepIndex();
                const isActive = step.key === currentStep;
                const isCompleted = currentIndex > index;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#3EB100] flex-shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-[#2A72E5] animate-spin flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#CCCCCC] flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isActive
                          ? "text-[#2A72E5] font-medium"
                          : isCompleted
                            ? "text-[#3EB100]"
                            : "text-[#999999]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Transaction Details */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Channel ID
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {truncatedChannelId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Recipient
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {amount} {tokenSymbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Completed State */}
        {modalState === "completed" && (
          <div className="flex flex-col items-center gap-6">
            <CheckCircle2 className="w-16 h-16 text-[#3EB100]" />
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                Proof Generated
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                Your ZK proof has been successfully generated and downloaded.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Channel ID
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {truncatedChannelId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Recipient
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {amount} {tokenSymbol}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="full"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        )}

        {/* Error State */}
        {modalState === "error" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#CD0003]/10 flex items-center justify-center">
              <X className="w-8 h-8 text-[#CD0003]" />
            </div>
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                Generation Failed
              </h3>
              <p className="text-[#CD0003]" style={{ fontSize: 14 }}>
                {error || "An error occurred while generating the proof."}
              </p>
            </div>

            <Button
              variant="primary"
              size="full"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the step update function type for external use
export type SetProofGenerationStep = (step: ProofGenerationStep) => void;
