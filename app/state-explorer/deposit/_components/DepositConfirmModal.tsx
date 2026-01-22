/**
 * Deposit Confirm Modal
 *
 * Modal for confirming and completing deposit transaction
 * Integrated flow: Sign for MPT key -> (Approve if needed) -> Sign for Deposit
 */

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, Copy, Circle } from "lucide-react";
import { Button } from "@/components/ui";
import type { DepositStep } from "../_hooks";

interface DepositConfirmModalProps {
  channelId: string;
  depositAmount: string;
  tokenSymbol?: string;
  onDeposit: () => Promise<void>;
  isProcessing: boolean;
  txHash: string | null;
  onClose: () => void;
  currentStep?: DepositStep;
}

type ModalState = "confirm" | "processing" | "completed";

export function DepositConfirmModal({
  channelId,
  depositAmount,
  tokenSymbol = "TON",
  onDeposit,
  isProcessing,
  txHash,
  onClose,
  currentStep = "idle",
}: DepositConfirmModalProps) {
  const [modalState, setModalState] = useState<ModalState>("confirm");
  const [copiedChannelId, setCopiedChannelId] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Update modal state based on props
  useEffect(() => {
    if (currentStep === "completed") {
      setModalState("completed");
    } else if (isProcessing) {
      setModalState("processing");
    } else if (txHash) {
      setModalState("completed");
    } else if (modalState === "processing" && currentStep === "error") {
      // If error occurred, go back to confirm
      setModalState("confirm");
    }
  }, [isProcessing, txHash, modalState, currentStep]);

  // Get step progress info
  const getStepInfo = (step: DepositStep) => {
    const steps = [
      { key: "signing_mpt", label: "Generating L2 MPT Key" },
      { key: "signing_deposit", label: "Signing Deposit" },
      { key: "confirming", label: "Confirming Transaction" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);
    return { steps, currentIndex };
  };

  const handleConfirm = async () => {
    setModalState("processing");
    try {
      await onDeposit();
    } catch (err) {
      // If user rejected or error occurred, go back to confirm state
      setModalState("confirm");
    }
  };

  const handleClose = () => {
    if (modalState !== "processing") {
      onClose();
    }
  };

  const handleCopyChannelId = async () => {
    try {
      await navigator.clipboard.writeText(channelId);
      setCopiedChannelId(true);
      setTimeout(() => setCopiedChannelId(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyTxHash = async () => {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxHash(true);
      setTimeout(() => setCopiedTxHash(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Truncate for display
  const truncatedChannelId = channelId
    ? `${channelId.slice(0, 10)}...${channelId.slice(-8)}`
    : "";
  const truncatedTxHash = txHash
    ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
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
                Confirm Deposit
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                Please confirm the deposit details below
              </p>
            </div>

            {/* Transaction Details */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between items-center">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Channel ID
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {truncatedChannelId}
                  </span>
                  <button
                    onClick={handleCopyChannelId}
                    className="p-1 hover:bg-[#F2F2F2] rounded"
                    title={copiedChannelId ? "Copied!" : "Copy"}
                  >
                    <Copy className={`w-4 h-4 ${copiedChannelId ? "text-[#3EB100]" : "text-[#666666]"}`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {depositAmount} {tokenSymbol}
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
                Processing Deposit
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                Please sign the transactions in your wallet
              </p>
            </div>

            {/* Step Progress */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              {getStepInfo(currentStep).steps.map((step, index) => {
                const { currentIndex } = getStepInfo(currentStep);
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
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {depositAmount} {tokenSymbol}
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
                Deposit Completed
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                Your deposit has been successfully completed.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between items-center">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Channel ID
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {truncatedChannelId}
                  </span>
                  <button
                    onClick={handleCopyChannelId}
                    className="p-1 hover:bg-[#F2F2F2] rounded"
                    title={copiedChannelId ? "Copied!" : "Copy"}
                  >
                    <Copy className={`w-4 h-4 ${copiedChannelId ? "text-[#3EB100]" : "text-[#666666]"}`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Amount
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  {depositAmount} {tokenSymbol}
                </span>
              </div>
              {txHash && (
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Tx Hash
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                      {truncatedTxHash}
                    </span>
                    <button
                      onClick={handleCopyTxHash}
                      className="p-1 hover:bg-[#F2F2F2] rounded"
                      title={copiedTxHash ? "Copied!" : "Copy"}
                    >
                      <Copy className={`w-4 h-4 ${copiedTxHash ? "text-[#3EB100]" : "text-[#666666]"}`} />
                    </button>
                  </div>
                </div>
              )}
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
