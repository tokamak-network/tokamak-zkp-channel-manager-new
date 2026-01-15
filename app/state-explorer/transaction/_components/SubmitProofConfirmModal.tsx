/**
 * Submit Proof Confirmation Modal
 *
 * Displays formatted proofs and allows user to confirm submission
 */

"use client";

import { Button } from "@tokamak/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { FormattedProofForSubmission } from "@/app/state-explorer/_utils/proofFormatter";

interface VerifiedProof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  submittedAt: string | number; // Unix timestamp (number) or ISO string (string) for backward compatibility
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
  if (!formattedProofs) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Proof Submission Successful</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span>Confirm Proof Submission</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Proofs have been successfully submitted to the contract."
              : "Review the formatted proofs before submitting to the contract."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Transaction Successful</h3>
              </div>
              <p className="text-sm text-green-700">
                {formattedProofs.proofData.length} proof(s) have been submitted to the contract.
              </p>
              {formattedProofs.finalStateRoot && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-xs text-green-600 mb-1">Final State Root</div>
                  <div className="font-mono text-sm text-green-900 break-all">
                    {formattedProofs.finalStateRoot}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Proof List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Proofs to Submit ({verifiedProofs.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {verifiedProofs.map((proof, index) => (
                  <div
                    key={proof.key}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium text-gray-900">
                          proof#{proof.sequenceNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(proof.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        #{index + 1} of {verifiedProofs.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formatted Data Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Submission Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Total Proofs:</span>
                  <span className="font-medium text-blue-900">
                    {formattedProofs.proofData.length}
                  </span>
                </div>
                {formattedProofs.finalStateRoot && (
                  <div>
                    <div className="text-blue-600 mb-1">Final State Root:</div>
                    <div className="font-mono text-xs text-blue-900 break-all bg-white p-2 rounded border border-blue-200">
                      {formattedProofs.finalStateRoot}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {isSuccess ? (
            <Button variant="primary" color="green" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                color="gray"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                color="blue"
                onClick={onConfirm}
                disabled={isSubmitting || !formattedProofs}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
