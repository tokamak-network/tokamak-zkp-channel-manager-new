/**
 * Transaction Confirm Modal
 *
 * Modal for confirming and completing L2 transaction
 * Two states:
 * 1. Confirm Transaction: Generate ZK Proof
 * 2. Transaction Confirmed: Submit & Download completed
 */

"use client";

import { useState } from "react";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatAddress } from "@/lib/utils/format";

interface TransactionConfirmModalProps {
  channelId: string;
  recipient: string;
  amount: string;
  tokenSymbol?: string;
  onGenerateProof: () => Promise<void>;
  onSubmitAndDownload: () => Promise<void>;
  isGenerating: boolean;
  isSubmitting: boolean;
  proofGenerated: boolean;
  txHash: string | null;
  onClose: () => void;
}

export function TransactionConfirmModal({
  channelId,
  recipient,
  amount,
  tokenSymbol = "TON",
  onGenerateProof,
  onSubmitAndDownload,
  isGenerating,
  isSubmitting,
  proofGenerated,
  txHash,
  onClose,
}: TransactionConfirmModalProps) {
  const [copiedChannelId, setCopiedChannelId] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Transaction is confirmed when we have txHash and not submitting
  const isTransactionConfirmed = !!txHash && !isSubmitting;

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

  // Show loading state when generating proof
  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="w-[500px] bg-white rounded p-6 font-mono">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <LoadingSpinner size="lg" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-[#111111]">
                Generating ZK Proof...
              </p>
              <p className="text-sm text-[#666666]">
                This may take a few minutes. Please wait.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[500px] bg-white rounded p-6 space-y-8 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-[#111111]">
            {isTransactionConfirmed ? "Transaction Confirmed" : "Confirm Transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#F2F2F2] rounded transition-colors"
          >
            <X className="w-6 h-6 text-[#666666]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Channel ID */}
          <div className="space-y-2">
            <p className="text-lg text-[#666666]">Channel ID</p>
            <div className="flex items-center gap-10 py-3.5">
              <p className="text-lg font-medium text-[#111111] break-all flex-1">
                {channelId}
              </p>
              <button
                type="button"
                onClick={handleCopyChannelId}
                className="flex-shrink-0 p-1 hover:bg-[#F2F2F2] rounded transition-colors"
                title={copiedChannelId ? "Copied!" : "Copy to clipboard"}
              >
                <Copy
                  className={`w-6 h-6 ${copiedChannelId ? "text-[#3EB100]" : "text-[#666666]"}`}
                />
              </button>
            </div>
          </div>

          {/* Proof ID (after confirmed) */}
          {isTransactionConfirmed && txHash && (
            <div className="space-y-2 pt-4 border-t border-[#BBBBBB]">
              <p className="text-lg text-[#666666]">Proof ID</p>
              <div className="flex items-center gap-10 py-3.5">
                <p className="text-lg font-medium text-[#111111] break-all flex-1">
                  {txHash}
                </p>
                <button
                  type="button"
                  onClick={handleCopyTxHash}
                  className="flex-shrink-0 p-1 hover:bg-[#F2F2F2] rounded transition-colors"
                  title={copiedTxHash ? "Copied!" : "Copy to clipboard"}
                >
                  <Copy
                    className={`w-6 h-6 ${copiedTxHash ? "text-[#3EB100]" : "text-[#666666]"}`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Transaction Details (before confirmed) */}
          {!isTransactionConfirmed && (
            <>
              <div className="space-y-2">
                <p className="text-lg text-[#666666]">Recipient</p>
                <div className="py-3.5">
                  <p className="text-lg font-medium text-[#111111]">
                    {formatAddress(recipient)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-lg text-[#666666]">Amount</p>
                <div className="flex items-center justify-between py-3.5">
                  <p className="text-lg font-medium text-[#111111]">
                    {amount}
                  </p>
                  <p className="text-lg font-medium text-[#111111]">
                    {tokenSymbol}
                  </p>
                </div>
              </div>

              {/* Proof Generated Success Message */}
              {proofGenerated && (
                <div className="p-4 bg-[#E8F5E9] border border-[#4CAF50] rounded">
                  <p className="text-[#2E7D32] font-medium">
                    ✓ ZK Proof generated successfully!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isTransactionConfirmed && (
          <>
            {!proofGenerated ? (
              <Button
                variant="primary"
                size="full"
                onClick={onGenerateProof}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate ZK Proof"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="full"
                onClick={onSubmitAndDownload}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit & Download"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
