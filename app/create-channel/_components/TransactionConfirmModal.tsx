/**
 * Transaction Confirm Modal
 *
 * Modal shown after successful channel creation
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210616
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Copy } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { Button } from "@/components/ui";

interface TransactionConfirmModalProps {
  channelId: string;
  txHash: string;
  participantCount?: number;
  onClose: () => void;
}

export function TransactionConfirmModal({
  channelId,
  txHash,
  participantCount = 2,
  onClose,
}: TransactionConfirmModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleConfirm = () => {
    // Store channel ID in Zustand store (not in URL for privacy)
    const { setCurrentChannelId } = useChannelFlowStore.getState();
    setCurrentChannelId(channelId);

    onClose();
    router.push("/join-channel");
  };

  const handleCopyChannelId = async () => {
    try {
      await navigator.clipboard.writeText(channelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            Confirm Transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#F2F2F2] rounded transition-colors"
          >
            <X className="w-6 h-6 text-[#666666]" />
          </button>
        </div>

        {/* Channel ID */}
        <div className="space-y-4">
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
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                <Copy
                  className={`w-6 h-6 ${copied ? "text-[#3EB100]" : "text-[#666666]"}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Number of Participants */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg text-[#666666]">Number of Participants</p>
            <p className="text-lg font-medium text-[#111111]">
              {participantCount}
            </p>
          </div>
        </div>

        {/* Confirmed Button */}
        <Button size="full" onClick={handleConfirm}>
          Confirmed
        </Button>
      </div>
    </div>
  );
}
