/**
 * Submit Proof Confirmation Modal
 *
 * Displays formatted proofs and allows user to confirm submission
 * Styled consistently with other modals (Delete, Verify, ProofGeneration)
 */

"use client";

import { X, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { FormattedProofForSubmission } from "@/app/state-explorer/_utils/proofFormatter";

interface VerifiedProof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  submittedAt: string | number;
}

interface SubmitProofConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formattedProofs: FormattedProofForSubmission | null;
  verifiedProofs: VerifiedProof[];
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function SubmitProofConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  formattedProofs,
  verifiedProofs,
  isSubmitting,
  isSuccess,
  error,
}: SubmitProofConfirmModalProps) {
  if (!isOpen || !formattedProofs) {
    return null;
  }

  const handleClose = () => {
    if (!isSubmitting) {
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
        style={{ width: 480, padding: 32, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Close button */}
        {!isSubmitting && (
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
                Submission Successful
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                {formattedProofs.proofData.length} proof(s) have been submitted to the contract.
              </p>
            </div>

            {/* Final State Root */}
            {formattedProofs.finalStateRoot && (
              <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Final State Root
                  </span>
                </div>
                <div 
                  className="text-[#111111] font-medium break-all" 
                  style={{ fontSize: 12 }}
                >
                  {formattedProofs.finalStateRoot}
                </div>
              </div>
            )}

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
                {isSubmitting ? "Submitting Proofs" : "Confirm Submission"}
              </h3>
              <p className="text-[#666666]" style={{ fontSize: 14 }}>
                {isSubmitting 
                  ? "Please wait while proofs are being submitted..."
                  : "Review the proofs before submitting to the contract."}
              </p>
            </div>

            {/* Submitting State */}
            {isSubmitting ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-16 h-16 text-[#2A72E5] animate-spin" />
              </div>
            ) : (
              <>
                {/* Proof List */}
                <div className="w-full pt-4 border-t border-[#EEEEEE]">
                  <div className="flex justify-between mb-3">
                    <span className="text-[#666666]" style={{ fontSize: 14 }}>
                      Proofs to Submit
                    </span>
                    <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                      {verifiedProofs.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {verifiedProofs.map((proof) => (
                      <div
                        key={proof.key}
                        className="flex justify-between items-center py-2 px-3 bg-[#F8F8F8] rounded"
                      >
                        <span className="text-[#111111]" style={{ fontSize: 14 }}>
                          Proof#{proof.sequenceNumber}
                        </span>
                        <span className="text-[#666666]" style={{ fontSize: 12 }}>
                          {new Date(proof.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final State Root */}
                {formattedProofs.finalStateRoot && (
                  <div className="w-full space-y-2">
                    <span className="text-[#666666]" style={{ fontSize: 14 }}>
                      Final State Root
                    </span>
                    <div 
                      className="text-[#111111] break-all bg-[#F8F8F8] p-3 rounded" 
                      style={{ fontSize: 12 }}
                    >
                      {formattedProofs.finalStateRoot}
                    </div>
                  </div>
                )}

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
                    Submit
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
