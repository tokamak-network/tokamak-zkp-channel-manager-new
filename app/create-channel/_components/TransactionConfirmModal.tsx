/**
 * Transaction Confirm Modal
 *
 * Modal shown after successful channel creation
 */

"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader } from "@tokamak/ui";

interface TransactionConfirmModalProps {
  channelId: string;
  txHash: string;
  onClose: () => void;
}

export function TransactionConfirmModal({
  channelId,
  txHash,
  onClose,
}: TransactionConfirmModalProps) {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    router.push(`/join-channel?channelId=${channelId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Transaction Confirmed</h3>
              <p className="text-sm text-gray-500">Channel created successfully</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel ID */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Channel ID</p>
            <p className="text-2xl font-bold text-gray-900">{channelId}</p>
          </div>

          {/* Transaction Hash */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
            <p className="text-xs font-mono text-gray-700 break-all">{txHash}</p>
          </div>

          {/* Info Message */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            Click "Confirm" to proceed to the channel page
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleConfirm} className="flex-1">
              Confirm
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
