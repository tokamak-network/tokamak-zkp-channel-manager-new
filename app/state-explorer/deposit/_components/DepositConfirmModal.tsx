/**
 * Deposit Confirm Modal
 *
 * Modal for confirming and completing deposit transaction
 * Two states:
 * 1. Confirm Transaction: Before transaction execution
 * 2. Transaction Confirmed: After transaction completion
 *
 * Design:
 * - Confirm: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-212007
 * - Confirmed: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-212167
 */

"use client";

import { useState } from "react";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui";

interface DepositConfirmModalProps {
  channelId: string;
  depositAmount: string;
  tokenSymbol?: string;
  onDeposit: () => Promise<void>;
  isProcessing: boolean;
  txHash: string | null;
  onClose: () => void;
}

export function DepositConfirmModal({
  channelId,
  depositAmount,
  tokenSymbol = "TON",
  onDeposit,
  isProcessing,
  txHash,
  onClose,
}: DepositConfirmModalProps) {
  const [copiedChannelId, setCopiedChannelId] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Transaction is confirmed when we have txHash and not processing anymore
  const isTransactionConfirmed = !!txHash && !isProcessing;

  const handleConfirm = async () => {
    await onDeposit();
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

          {/* Transaction Hash - Only show after confirmed */}
          {isTransactionConfirmed && txHash && (
            <div className="space-y-2 pt-4 border-t border-[#BBBBBB]">
              <p className="text-lg text-[#666666]">Transaction Hash</p>
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

          {/* Deposit Amount - Only show before confirmed */}
          {!isTransactionConfirmed && (
            <div className="space-y-2">
              <p className="text-lg text-[#666666]">Deposit Amount</p>
              <div className="flex items-center justify-between py-3.5">
                <p className="text-lg font-medium text-[#111111]">
                  {depositAmount}
                </p>
                <p className="text-lg font-medium text-[#111111]">
                  {tokenSymbol}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Only show before confirmed */}
        {!isTransactionConfirmed && (
          <Button
            variant="primary"
            size="full"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Confirming..." : "Confirmed"}
          </Button>
        )}
      </div>
    </div>
  );
}
