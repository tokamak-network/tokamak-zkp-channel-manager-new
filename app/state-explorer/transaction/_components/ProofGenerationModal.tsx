/**
 * Proof Generation Modal
 *
 * Modal for generating ZK proof after signing
 * Shows confirm step first, then progress and handles download
 */

"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

interface ProofGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateProof: () => Promise<void>;
  channelId: string;
  recipient: string;
  amount: string;
  tokenSymbol: string;
}

type ModalState = "confirm" | "generating" | "completed" | "error";

export function ProofGenerationModal({
  isOpen,
  onClose,
  onGenerateProof,
  channelId,
  recipient,
  amount,
  tokenSymbol,
}: ProofGenerationModalProps) {
  const [modalState, setModalState] = useState<ModalState>("confirm");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setModalState("generating");
    setError(null);
    
    try {
      await onGenerateProof();
      setModalState("completed");
    } catch (err) {
      setModalState("error");
      setError(err instanceof Error ? err.message : "Failed to generate proof");
    }
  };

  const handleClose = () => {
    if (modalState !== "generating") {
      setModalState("confirm"); // Reset state for next open
      onClose();
    }
  };

  // Truncate channel ID for display
  const truncatedChannelId = channelId
    ? `${channelId.slice(0, 8)}...${channelId.slice(-6)}`
    : "";

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
        {/* Close button - only show when not generating */}
        {modalState !== "generating" && (
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

        {/* Generating State */}
        {modalState === "generating" && (
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
                Please wait while your ZK proof is being generated...
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
