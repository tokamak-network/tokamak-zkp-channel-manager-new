/**
 * Approve Confirm Modal
 *
 * Shows confirmation dialog before approving a proof
 * Then shows success message after approval is complete
 * Styled consistently with other modals (SubmitProofConfirm, Delete, etc.)
 */

"use client";

import { X, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { Proof } from "../_hooks/useProofs";
import { formatDateTime } from "../_utils/proofUtils";

interface ApproveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  proofToApprove: Proof | null;
  isApproving: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function ApproveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  proofToApprove,
  isApproving,
  isSuccess,
  error,
}: ApproveConfirmModalProps) {
  if (!isOpen || !proofToApprove) {
    return null;
  }

  const handleClose = () => {
    if (!isApproving) {
      onClose();
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
        {/* Close button */}
        {!isApproving && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        )}

        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center gap-6">
            <CheckCircle2 className="w-16 h-16 text-[#3EB100]" />
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                Proof Approved
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                The proof has been successfully approved and verified.
              </p>
            </div>

            {/* Approved Proof Info */}
            <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
              <div className="flex justify-between items-center py-2 px-3 bg-[#F8F8F8] rounded">
                <span className="text-[#666666]" style={{ fontSize: 14 }}>
                  Approved Proof
                </span>
                <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                  Proof#{proofToApprove.sequenceNumber}
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
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="text-center">
              <h3
                className="font-medium text-[#111111] mb-2"
                style={{ fontSize: 24 }}
              >
                {isApproving ? "Approving Proof" : "Confirm Approval"}
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                {isApproving
                  ? "Please wait while the proof is being approved..."
                  : "Review the proof details before approving."}
              </p>
            </div>

            {/* Approving State */}
            {isApproving ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-16 h-16 text-[#2A72E5] animate-spin" />
              </div>
            ) : (
              <>
                {/* Proof Details */}
                <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
                  <div className="flex justify-between">
                    <span className="text-[#666666]" style={{ fontSize: 14 }}>
                      Proof ID
                    </span>
                    <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                      Proof#{proofToApprove.sequenceNumber}-{proofToApprove.subNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]" style={{ fontSize: 14 }}>
                      Date
                    </span>
                    <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                      {formatDateTime(proofToApprove.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] rounded">
                    <XCircle className="w-4 h-4 text-[#CD0003] flex-shrink-0" />
                    <span className="text-sm text-[#CD0003]">{error}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={onConfirm}
                  >
                    Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
