/**
 * Proof List Component
 *
 * Displays a list of proofs for the current channel
 * Shows summary statistics and individual proof items
 *
 * Design: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3138-231957
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Download,
  Upload,
  Trash2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useBridgeCoreRead } from "@/hooks/contract";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SubmitProofModal } from "@/app/state-explorer/_components/SubmitProofModal";
import { useProofs, useProofActions, type Proof } from "../_hooks";
import { formatDate } from "../_utils/proofUtils";
import { useSubmitProof } from "@/app/state-explorer/_hooks/useSubmitProof";
import { SubmitProofConfirmModal } from "./SubmitProofConfirmModal";

interface ProofListProps {
  onRefresh?: () => void;
  onActionsReady?: (actions: {
    downloadAllApproved: () => void;
    openUploadModal: () => void;
    openSubmitProofModal: () => void;
    isDownloadingAllApproved: boolean;
    approvedProofsCount: number;
    isLoadingProofs: boolean;
    isSubmitting: boolean;
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

  // Expose actions to parent component
  useEffect(() => {
    if (onActionsReady) {
      onActionsReady({
        downloadAllApproved: handleDownloadAllApprovedProofs,
        openUploadModal: () => setIsSubmitProofModalOpen(true),
        openSubmitProofModal: handleSubmitProofClick,
        isDownloadingAllApproved,
        approvedProofsCount,
        isLoadingProofs,
        isSubmitting,
      });
    }
  }, [onActionsReady, handleDownloadAllApprovedProofs, isDownloadingAllApproved, approvedProofsCount, isLoadingProofs, isSubmitting]);

  // Handle confirm submission
  const handleConfirmSubmit = async () => {
    try {
      await submitProofs();
    } catch (error) {
      console.error("Failed to submit proofs:", error);
    }
  };

  // Close modal on success
  useEffect(() => {
    if (isTransactionSuccess && currentChannelId) {
      fetchProofs();
      window.dispatchEvent(new CustomEvent('proof-submit-success', {
        detail: { channelId: currentChannelId }
      }));
    }
  }, [isTransactionSuccess, currentChannelId, fetchProofs]);

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

  // Status badge colors based on Figma
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "verified":
        return { bg: "#3EB100", text: "Approved" };
      case "pending":
        return { bg: "#AA6C00", text: "Pending" };
      case "rejected":
        return { bg: "#CD0003", text: "Rejected" };
      default:
        return { bg: "#666666", text: status };
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Summary Statistics */}
      <div
        className="flex border border-[#000000] rounded"
        style={{ backgroundColor: "#BDBDBD" }}
      >
        {/* Total Proofs */}
        <div className="flex-1 p-4 flex flex-col justify-between border-r border-[#000000]">
          <span
            className="text-xs font-medium uppercase px-2 py-1 rounded inline-block"
            style={{ backgroundColor: "#0F2058", color: "#FFFFFF" }}
          >
            Total Proofs
          </span>
          <span className="text-2xl font-normal text-black mt-4">{stats.total}</span>
        </div>
        {/* Approved */}
        <div className="flex-1 p-4 flex flex-col justify-between border-r border-[#000000]">
          <span
            className="text-xs font-medium uppercase px-2 py-1 rounded inline-block"
            style={{ backgroundColor: "#3EB100", color: "#FFFFFF" }}
          >
            Approved
          </span>
          <span className="text-2xl font-normal text-black mt-4">{stats.approved}</span>
        </div>
        {/* Pending */}
        <div className="flex-1 p-4 flex flex-col justify-between border-r border-[#000000]">
          <span
            className="text-xs font-medium uppercase px-2 py-1 rounded inline-block"
            style={{ backgroundColor: "#AA6C00", color: "#FFFFFF" }}
          >
            Pending
          </span>
          <span className="text-2xl font-normal text-black mt-4">{stats.pending}</span>
        </div>
        {/* Rejected */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <span
            className="text-xs font-medium uppercase px-2 py-1 rounded inline-block"
            style={{ backgroundColor: "#CD0003", color: "#FFFFFF" }}
          >
            Rejected
          </span>
          <span className="text-2xl font-normal text-black mt-4">{stats.rejected}</span>
        </div>
      </div>

      {/* Download/Upload Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleDownloadAllApprovedProofs}
          disabled={isDownloadingAllApproved || approvedProofsCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#111111] rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontSize: 18, height: 40 }}
        >
          <Download className="w-4 h-4" />
          {isDownloadingAllApproved ? "Downloading..." : "Download"}
        </button>
        <button
          type="button"
          onClick={() => setIsSubmitProofModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#111111] rounded bg-white"
          style={{ fontSize: 18, height: 40 }}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Proof Table */}
      <div className="border-t border-[#DDDDDD]">
        {proofs.length === 0 ? (
          <div className="text-center py-12 text-[#666666]">
            No proofs found for this channel
          </div>
        ) : (
          proofs.map((proof, index) => {
            const statusStyle = getStatusBadgeStyle(proof.status);
            return (
              <div
                key={proof.key}
                className={`flex items-center py-2.5 ${
                  index < proofs.length - 1 ? "border-b border-[#DDDDDD]" : ""
                }`}
              >
                {/* Radio button for pending proofs (leader only) */}
                <div className="w-[34px] flex items-center justify-center px-2">
                  {proof.status === "pending" && isLeader && (
                    <input
                      type="radio"
                      name="proofApproval"
                      value={proof.key}
                      checked={selectedProofForApproval === proof.key}
                      onChange={(e) => setSelectedProofForApproval(e.target.value)}
                      className="w-[18px] h-[18px] cursor-pointer"
                    />
                  )}
                </div>

                {/* Status Tag */}
                <div className="w-[100px] px-2">
                  <span
                    className="text-xs font-medium uppercase px-2 py-1 rounded inline-block"
                    style={{ backgroundColor: statusStyle.bg, color: "#FFFFFF" }}
                  >
                    {statusStyle.text}
                  </span>
                </div>

                {/* Proof ID */}
                <div className="w-[160px] px-2 text-sm text-[#222222]">
                  {proof.status === "verified"
                    ? `Proof#${proof.sequenceNumber}`
                    : `Proof#${proof.sequenceNumber}-${proof.subNumber}`}
                </div>

                {/* Date */}
                <div className="flex-1 px-2 text-sm text-[#222222]">
                  {formatDate(proof.submittedAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyProof(proof)}
                    disabled={isVerifying}
                    className="p-1.5 hover:bg-[#F2F2F2] rounded transition-colors disabled:opacity-50"
                    title="Verify Proof"
                  >
                    <FileCheck className="w-4 h-4 text-[#666666]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(proof)}
                    disabled={downloadingProofKey === proof.key}
                    className="p-1.5 hover:bg-[#F2F2F2] rounded transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-[#666666]" />
                  </button>
                  {isLeader && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(proof)}
                      disabled={deletingProofKey === proof.key}
                      className="p-1.5 hover:bg-[#F2F2F2] rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[#CD0003]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Approve Button + Pagination */}
      <div className="flex items-center justify-between">
        {/* Approve Selected Proof Button */}
        {showApproveButton ? (
          <button
            type="button"
            onClick={handleApproveSelected}
            disabled={!selectedProofForApproval || isVerifying}
            className="flex items-center justify-center font-mono font-medium transition-colors disabled:opacity-50"
            style={{
              height: 40,
              padding: "16px 24px",
              borderRadius: 4,
              border: "1px solid #111111",
              backgroundColor: "#2A72E5",
              color: "#FFFFFF",
              fontSize: 18,
            }}
          >
            {isVerifying ? "Processing..." : "Approve Selected Proof"}
          </button>
        ) : (
          <div />
        )}

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="w-5 h-5 flex items-center justify-center text-sm text-[#A8A8A8]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-5 h-6 flex items-center justify-center text-sm text-white rounded"
            style={{ backgroundColor: "#04008A" }}
          >
            1
          </button>
          <button
            type="button"
            className="w-5 h-6 flex items-center justify-center text-sm text-[#222222]"
          >
            2
          </button>
          <button
            type="button"
            className="w-5 h-6 flex items-center justify-center text-sm text-[#222222]"
          >
            3
          </button>
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center text-sm text-[#222222]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

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
