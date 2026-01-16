/**
 * Proof List Component
 *
 * Displays a list of proofs for the current channel
 * Shows summary statistics and individual proof items
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@tokamak/ui";
import {
  Download,
  Trash2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useBridgeCoreRead } from "@/hooks/contract";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SubmitProofModal } from "@/app/state-explorer/_components/SubmitProofModal";
import { useProofs, useProofActions, type Proof } from "../_hooks";
import { formatDate } from "../_utils/proofUtils";
import { ProofStatusBadge } from "./ProofStatusBadge";
import { useSubmitProof } from "@/app/state-explorer/_hooks/useSubmitProof";
import { SubmitProofConfirmModal } from "./SubmitProofConfirmModal";

interface ProofListProps {
  onRefresh?: () => void;
  onActionsReady?: (actions: {
    downloadAllApproved: () => void;
    openUploadModal: () => void;
    isDownloadingAllApproved: boolean;
    approvedProofsCount: number;
  }) => void;
}

export function ProofList({ onActionsReady }: ProofListProps) {
  const { address } = useAccount();
  const { currentChannelId } = useChannelFlowStore();

  // Get channel leader
  const { data: channelLeader } = useBridgeCoreRead({
    functionName: "getChannelLeader",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && !!address,
    },
  });

  // Check if current user is leader
  const isLeader =
    channelLeader && address
      ? String(channelLeader).toLowerCase() === String(address).toLowerCase()
      : false;

  // Debug logging
  useEffect(() => {
    console.log("[ProofList] Leader check:", {
      channelLeader,
      address,
      isLeader,
      currentChannelId,
    });
  }, [channelLeader, address, isLeader, currentChannelId]);

  // Use proof fetching hook
  const {
    proofs,
    isLoading,
    error,
    refetch: fetchProofs,
  } = useProofs({
    channelId: currentChannelId,
  });

  // Use proof actions hook
  const {
    handleDownloadAllApprovedProofs,
    handleDownload,
    isDownloadingAllApproved,
    downloadingProofKey,
    handleDeleteClick,
    handleDeleteConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    proofToDelete,
    setProofToDelete,
    deletingProofKey,
    handleApproveSelected,
    selectedProofForApproval,
    setSelectedProofForApproval,
    isVerifying,
    handleVerifyProof,
  } = useProofActions({
    channelId: currentChannelId,
    proofs,
    isLeader,
    onRefresh: fetchProofs,
  });

  const [isSubmitProofModalOpen, setIsSubmitProofModalOpen] = useState(false);
  const [isSubmitProofConfirmModalOpen, setIsSubmitProofConfirmModalOpen] = useState(false);

  // Submit proof hook
  const {
    loadAndFormatProofs,
    submitProofs,
    isLoadingProofs,
    isSubmitting,
    isTransactionSuccess,
    error: submitError,
    formattedProofs,
    verifiedProofsList,
  } = useSubmitProof(currentChannelId);

  // Calculate statistics
  const stats = {
    total: proofs.length,
    approved: proofs.filter((p) => p.status === "verified").length,
    pending: proofs.filter((p) => p.status === "pending").length,
    rejected: proofs.filter((p) => p.status === "rejected").length,
  };

  // Get pending proofs for leader approval
  const pendingProofs = proofs.filter((p) => p.status === "pending");
  const showApproveButton = isLeader && pendingProofs.length > 0;

  // Get approved proofs count (before early returns)
  const approvedProofsCount = proofs.filter(
    (p) => p.status === "verified"
  ).length;

  // Expose actions to parent component
  useEffect(() => {
    if (onActionsReady) {
      onActionsReady({
        downloadAllApproved: handleDownloadAllApprovedProofs,
        openUploadModal: () => setIsSubmitProofModalOpen(true),
        isDownloadingAllApproved,
        approvedProofsCount,
      });
    }
  }, [onActionsReady, handleDownloadAllApprovedProofs, isDownloadingAllApproved, approvedProofsCount]);

  // Handle submit proof button click
  const handleSubmitProofClick = async () => {
    if (!currentChannelId || approvedProofsCount === 0) {
      alert("No approved proofs to submit");
      return;
    }

    try {
      await loadAndFormatProofs();
      setIsSubmitProofConfirmModalOpen(true);
    } catch (error) {
      console.error("Failed to load proofs:", error);
      alert(error instanceof Error ? error.message : "Failed to load proofs");
    }
  };

  // Handle confirm submission
  const handleConfirmSubmit = async () => {
    try {
      await submitProofs();
    } catch (error) {
      console.error("Failed to submit proofs:", error);
      // Error is already handled in the hook
    }
  };

  // Close modal on success - must be before early returns
  useEffect(() => {
    if (isTransactionSuccess && currentChannelId) {
      // Refresh proof list after successful submission
      fetchProofs();
      // Dispatch event to notify parent components to refetch channel state
      window.dispatchEvent(new CustomEvent('proof-submit-success', {
        detail: { channelId: currentChannelId }
      }));
      // Modal will be closed by user clicking Close button
    }
  }, [isTransactionSuccess, currentChannelId, fetchProofs]);

  // Debug logging
  useEffect(() => {
    console.log("[ProofList] Approve button visibility:", {
      isLeader,
      pendingProofsCount: pendingProofs.length,
      pendingProofs: pendingProofs.map((p) => ({
        key: p.key,
        proofId: p.proofId,
        status: p.status,
      })),
      showApproveButton,
      selectedProofForApproval,
      allProofs: proofs.map((p) => ({
        key: p.key,
        proofId: p.proofId,
        status: p.status,
      })),
      channelLeader,
      address,
    });
  }, [
    isLeader,
    pendingProofs.length,
    showApproveButton,
    selectedProofForApproval,
    proofs.length,
    channelLeader,
    address,
  ]);

  // Early returns after all hooks
  if (!currentChannelId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Proofs</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-700">
            {stats.approved}
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">
            {stats.pending}
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-700">
            {stats.rejected}
          </div>
        </div>
      </div>

      {/* Approve Selected Proof Section (Leader Only) */}
      {showApproveButton && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yellow-800">
              Leader Action Required
            </h3>
            <span className="bg-yellow-500/20 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">
              PENDING APPROVAL
            </span>
          </div>
          <p className="text-yellow-700 text-sm mb-4">
            Select one proof to approve. All other proofs in the same sequence
            will be automatically rejected.
          </p>
        </div>
      )}

      {/* Proof List */}
      <div className="space-y-2">
        {proofs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No proofs found for this channel
          </div>
        ) : (
          proofs.map((proof) => (
            <div
              key={proof.key}
              className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-colors ${
                proof.status === "pending" &&
                selectedProofForApproval === proof.key
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Radio button for pending proofs (leader only) */}
                {proof.status === "pending" && isLeader && (
                  <input
                    type="radio"
                    name="proofApproval"
                    value={proof.key}
                    checked={selectedProofForApproval === proof.key}
                    onChange={(e) =>
                      setSelectedProofForApproval(e.target.value)
                    }
                    className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                  />
                )}

                {/* Status badge for verified/rejected proofs (left side) */}
                {(proof.status === "verified" ||
                  proof.status === "rejected") && (
                  <ProofStatusBadge status={proof.status} />
                )}

                {/* Proof ID - format based on status */}
                <div className="font-mono font-medium text-gray-900">
                  {proof.status === "verified"
                    ? `proof#${proof.sequenceNumber}`
                    : `proof#${proof.sequenceNumber}-${proof.subNumber}`}
                </div>

                {/* Date */}
                <div className="text-sm text-gray-600">
                  {formatDate(proof.submittedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Verify button - always available for all proofs */}
                <Button
                  variant="outline"
                  color="blue"
                  size="sm"
                  onClick={() => handleVerifyProof(proof)}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-1" />
                      Verify Proof
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  color="blue"
                  size="sm"
                  onClick={() => handleDownload(proof)}
                  disabled={downloadingProofKey === proof.key}
                >
                  {downloadingProofKey === proof.key ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-1" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Download Files
                    </>
                  )}
                </Button>
                {isLeader && (
                  <Button
                    variant="outline"
                    color="red"
                    size="sm"
                    onClick={() => handleDeleteClick(proof)}
                    disabled={deletingProofKey === proof.key}
                  >
                    {deletingProofKey === proof.key ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approve Selected Proof Button */}
      {showApproveButton && (
        <div className="mt-4">
          <Button
            variant="primary"
            color="yellow"
            onClick={handleApproveSelected}
            disabled={!selectedProofForApproval || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <LoadingSpinner size="sm" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Approve Selected Proof
              </>
            )}
          </Button>
        </div>
      )}

      {/* Submit Proof Button */}
      {isLeader && approvedProofsCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            color="blue"
            onClick={handleSubmitProofClick}
            disabled={isLoadingProofs || isSubmitting}
            className="w-full"
          >
            {isLoadingProofs ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading Proofs...
              </>
            ) : isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              <>Submit Proof ({approvedProofsCount})</>
            )}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Proof
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this proof? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {proofToDelete && (
            <div className="py-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Proof ID</div>
                <div className="font-mono font-medium text-gray-900">
                  {proofToDelete.proofId}
                </div>
                <div className="text-sm text-gray-600 mt-2 mb-1">Date</div>
                <div className="text-sm text-gray-900">
                  {formatDate(proofToDelete.submittedAt)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                setShowDeleteConfirm(false);
                setProofToDelete(null);
              }}
              disabled={deletingProofKey !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              color="red"
              onClick={handleDeleteConfirm}
              disabled={deletingProofKey !== null}
            >
              {deletingProofKey ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Proof Modal (Upload) */}
      {currentChannelId && (
        <SubmitProofModal
          isOpen={isSubmitProofModalOpen}
          onClose={() => setIsSubmitProofModalOpen(false)}
          channelId={currentChannelId}
          onUploadSuccess={() => {
            fetchProofs();
            setIsSubmitProofModalOpen(false);
          }}
        />
      )}

      {/* Submit Proof Confirmation Modal */}
      {currentChannelId && (
        <SubmitProofConfirmModal
          isOpen={isSubmitProofConfirmModalOpen}
          onClose={() => {
            setIsSubmitProofConfirmModalOpen(false);
            // Reset on close if not successful
            if (!isTransactionSuccess) {
              // Keep formatted proofs for retry
            }
          }}
          onConfirm={handleConfirmSubmit}
          formattedProofs={formattedProofs}
          verifiedProofs={verifiedProofsList}
          isSubmitting={isSubmitting}
          isSuccess={isTransactionSuccess}
          error={submitError}
        />
      )}
    </div>
  );
}
