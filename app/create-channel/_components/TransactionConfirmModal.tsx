/**
 * Transaction Confirm Modal
 *
 * Modal for confirming and completing channel creation transaction
 * Two states:
 * 1. Confirm Transaction: Before transaction execution
 * 2. Transaction Confirmed: After transaction completion
 *
 * Design:
 * - Confirm: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210616
 * - Confirmed: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210690
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Copy } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { Button } from "@/components/ui";

interface TransactionConfirmModalProps {
  channelId: string;
  participantCount: number;
  onCreateChannel: () => Promise<void>;
  isCreating: boolean;
  isConfirming: boolean;
  txHash: string | null;
  onClose: () => void;
}

export function TransactionConfirmModal({
  channelId,
  participantCount,
  onCreateChannel,
  isCreating,
  isConfirming,
  txHash,
  onClose,
}: TransactionConfirmModalProps) {
  const router = useRouter();
  const [copiedChannelId, setCopiedChannelId] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Transaction is confirmed when we have txHash and not confirming anymore
  const isTransactionConfirmed = !!txHash && !isConfirming && !isCreating;

  const handleConfirm = async () => {
    await onCreateChannel();
  };

  const handleJoinChannel = () => {
    // Store channel ID in Zustand store (not in URL for privacy)
    const { setCurrentChannelId } = useChannelFlowStore.getState();
    setCurrentChannelId(channelId);

    onClose();
    router.push("/join-channel");
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

          {/* Number of Participants - Only show before confirmed */}
          {!isTransactionConfirmed && (
            <div className="space-y-2">
              <p className="text-lg text-[#666666]">Number of Participants</p>
              <p className="text-lg font-medium text-[#111111]">
                {participantCount}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isTransactionConfirmed ? (
          <button
            type="button"
            onClick={handleJoinChannel}
            className="w-full h-14 px-6 py-4 rounded border border-[#111111] text-xl font-medium bg-[#773FE0] text-white hover:bg-[#6232c0] transition-colors"
          >
            Join Channel
          </button>
        ) : (
          <Button
            size="full"
            onClick={handleConfirm}
            disabled={isCreating || isConfirming}
          >
            {isCreating || isConfirming ? "Confirming..." : "Confirmed"}
          </Button>
        )}
      </div>
    </div>
  );
}
