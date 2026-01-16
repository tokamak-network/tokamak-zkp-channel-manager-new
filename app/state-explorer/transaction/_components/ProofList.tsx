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
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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

  // Verify modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [proofToVerify, setProofToVerify] = useState<Proof | null>(null);
  const [verifyResult, setVerifyResult] = useState<"idle" | "verifying" | "success" | "error">("idle");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(proofs.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProofs = proofs.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Get pending proofs for leader approval
  const pendingProofs = proofs.filter((p) => p.status === "pending");
  const showApproveButton = isLeader && pendingProofs.length > 0;

  // Get approved proofs count (before early returns)
  const approvedProofsCount = proofs.filter(
    (p) => p.status === "verified"
  ).length;

  // Handle verify button click - opens modal
  const handleVerifyClick = (proof: Proof) => {
    setProofToVerify(proof);
    setVerifyResult("idle");
    setShowVerifyModal(true);
  };

  // Handle verify confirmation
  const handleVerifyConfirm = async () => {
    if (!proofToVerify) return;
    
    setVerifyResult("verifying");
    try {
      await handleVerifyProof(proofToVerify);
      setVerifyResult("success");
    } catch {
      setVerifyResult("error");
    }
  };

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
        className="flex rounded"
        style={{ border: "1px solid #000000", height: 80 }}
      >
        {/* Total Proofs */}
        <div
          className="flex-1 flex flex-col justify-between"
          style={{
            padding: "12px 16px",
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #000000",
          }}
        >
          <span
            className="uppercase inline-block"
            style={{
              backgroundColor: "#0F2058",
              color: "#FFFFFF",
              padding: "3px 8px 4px",
              borderRadius: 4,
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Total Proofs
          </span>
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 20,
              fontWeight: 400,
              color: "#000000",
            }}
          >
            {stats.total}
          </span>
        </div>
        {/* Approved */}
        <div
          className="flex-1 flex flex-col justify-between"
          style={{
            padding: "12px 16px",
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #000000",
          }}
        >
          <span
            className="uppercase inline-block"
            style={{
              backgroundColor: "#3EB100",
              color: "#FFFFFF",
              padding: "3px 8px 4px",
              borderRadius: 4,
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Approved
          </span>
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 20,
              fontWeight: 400,
              color: "#000000",
            }}
          >
            {stats.approved}
          </span>
        </div>
        {/* Pending */}
        <div
          className="flex-1 flex flex-col justify-between"
          style={{
            padding: "12px 16px",
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #000000",
          }}
        >
          <span
            className="uppercase inline-block"
            style={{
              backgroundColor: "#AA6C00",
              color: "#FFFFFF",
              padding: "3px 8px 4px",
              borderRadius: 4,
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Pending
          </span>
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 20,
              fontWeight: 400,
              color: "#000000",
            }}
          >
            {stats.pending}
          </span>
        </div>
        {/* Rejected */}
        <div
          className="flex-1 flex flex-col justify-between"
          style={{
            padding: "12px 16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <span
            className="uppercase inline-block"
            style={{
              backgroundColor: "#CD0003",
              color: "#FFFFFF",
              padding: "3px 8px 4px",
              borderRadius: 4,
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Rejected
          </span>
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 20,
              fontWeight: 400,
              color: "#000000",
            }}
          >
            {stats.rejected}
          </span>
        </div>
      </div>

      {/* Download/Upload Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleDownloadAllApprovedProofs}
          disabled={isDownloadingAllApproved || approvedProofsCount === 0}
          className="flex items-center justify-center rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            gap: 6,
            padding: "6px 12px",
            border: "1px solid #BBBBBB",
            borderRadius: 4,
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 14,
            fontWeight: 500,
            color: "#111111",
          }}
        >
          <Download className="w-4 h-4" />
          {isDownloadingAllApproved ? "Downloading..." : "Download Proofs"}
        </button>
        <button
          type="button"
          onClick={() => setIsSubmitProofModalOpen(true)}
          className="flex items-center justify-center rounded bg-white"
          style={{
            gap: 6,
            padding: "6px 12px",
            border: "1px solid #BBBBBB",
            borderRadius: 4,
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 14,
            fontWeight: 500,
            color: "#111111",
          }}
        >
          <Upload className="w-4 h-4" />
          Upload Proofs
        </button>
      </div>

      {/* Proof Table */}
      <div className="border-t border-[#DDDDDD]">
        {proofs.length === 0 ? (
          <div className="text-center py-12 text-[#666666]">
            No proofs found for this channel
          </div>
        ) : (
          paginatedProofs.map((proof, index) => {
            const statusStyle = getStatusBadgeStyle(proof.status);
            return (
              <div
                key={proof.key}
                className={`flex items-center py-2.5 ${
                  index < paginatedProofs.length - 1 ? "border-b border-[#DDDDDD]" : ""
                }`}
              >
                {/* Radio button for pending proofs (leader only) */}
                <div 
                  className="w-[34px] flex items-center justify-center px-2 cursor-pointer"
                  onClick={() => {
                    if (proof.status === "pending" && isLeader) {
                      setSelectedProofForApproval(proof.key);
                    }
                  }}
                >
                  {proof.status === "pending" && isLeader && (
                    <input
                      type="radio"
                      name="proofApproval"
                      value={proof.key}
                      checked={selectedProofForApproval === proof.key}
                      onChange={(e) => setSelectedProofForApproval(e.target.value)}
                      className="w-[18px] h-[18px] cursor-pointer accent-[#2A72E5]"
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
                    onClick={() => handleVerifyClick(proof)}
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
          (() => {
            const isDisabled = !selectedProofForApproval || isVerifying;
            return (
              <button
                type="button"
                onClick={handleApproveSelected}
                disabled={isDisabled}
                className="font-mono font-medium rounded border transition-colors flex items-center justify-center h-12 px-6 text-lg"
                style={{
                  backgroundColor: isDisabled ? "#999999" : "#2A72E5",
                  color: isDisabled ? "#DCDCDC" : "#FFFFFF",
                  borderColor: "#111111",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                {isVerifying ? "Processing..." : "Approve Selected Proof"}
              </button>
            );
          })()
        ) : (
          <div />
        )}

        {/* Pagination - only show if there are proofs */}
        {proofs.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-5 h-5 flex items-center justify-center text-sm disabled:text-[#A8A8A8] text-[#222222]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-5 h-6 flex items-center justify-center text-sm rounded ${
                  currentPage === page
                    ? "text-white"
                    : "text-[#222222]"
                }`}
                style={currentPage === page ? { backgroundColor: "#04008A" } : {}}
              >
                {page}
              </button>
            ))}
            
            {/* Next button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-5 h-5 flex items-center justify-center text-sm disabled:text-[#A8A8A8] text-[#222222]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && proofToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (deletingProofKey === null) {
                setShowDeleteConfirm(false);
                setProofToDelete(null);
              }
            }}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-lg shadow-xl font-mono"
            style={{ width: 480, padding: 32 }}
          >
            {/* Close button */}
            {deletingProofKey === null && (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProofToDelete(null);
                }}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-[#666666]" />
              </button>
            )}

            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="text-center">
                <h3
                  className="font-medium text-[#111111] mb-2"
                  style={{ fontSize: 24 }}
                >
                  Delete Proof
                </h3>
                <p className="text-[#666666]" style={{ fontSize: 14 }}>
                  Are you sure you want to delete this proof? This action cannot be undone.
                </p>
              </div>

              {/* Proof Details */}
              <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Proof ID
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {proofToDelete.status === "verified"
                      ? `Proof#${proofToDelete.sequenceNumber}`
                      : `Proof#${proofToDelete.sequenceNumber}-${proofToDelete.subNumber}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Date
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {formatDate(proofToDelete.submittedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Status
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {proofToDelete.status === "verified" ? "Approved" : 
                     proofToDelete.status === "pending" ? "Pending" : "Rejected"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProofToDelete(null);
                  }}
                  disabled={deletingProofKey !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1"
                  onClick={handleDeleteConfirm}
                  disabled={deletingProofKey !== null}
                >
                  {deletingProofKey ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Confirmation Modal */}
      {showVerifyModal && proofToVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (verifyResult !== "verifying") {
                setShowVerifyModal(false);
                setProofToVerify(null);
                setVerifyResult("idle");
              }
            }}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-lg shadow-xl font-mono"
            style={{ width: 480, padding: 32 }}
          >
            {/* Close button */}
            {verifyResult !== "verifying" && (
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setProofToVerify(null);
                  setVerifyResult("idle");
                }}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-[#666666]" />
              </button>
            )}

            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="text-center">
                <h3
                  className="font-medium text-[#111111] mb-2"
                  style={{ fontSize: 24 }}
                >
                  {verifyResult === "success" ? "Verification Complete" : 
                   verifyResult === "error" ? "Verification Failed" : "Verify Proof"}
                </h3>
                <p className="text-[#666666]" style={{ fontSize: 14 }}>
                  {verifyResult === "success" 
                    ? "The proof has been verified successfully."
                    : verifyResult === "error"
                    ? "Failed to verify the proof. Please try again."
                    : verifyResult === "verifying"
                    ? "Verifying proof..."
                    : "Verify the proof details below"}
                </p>
              </div>

              {/* Proof Details */}
              <div className="w-full space-y-3 pt-4 border-t border-[#EEEEEE]">
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Proof ID
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {proofToVerify.status === "verified"
                      ? `Proof#${proofToVerify.sequenceNumber}`
                      : `Proof#${proofToVerify.sequenceNumber}-${proofToVerify.subNumber}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Date
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {formatDate(proofToVerify.submittedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]" style={{ fontSize: 14 }}>
                    Status
                  </span>
                  <span className="text-[#111111] font-medium" style={{ fontSize: 14 }}>
                    {proofToVerify.status === "verified" ? "Approved" : 
                     proofToVerify.status === "pending" ? "Pending" : "Rejected"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              {verifyResult === "idle" && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setShowVerifyModal(false);
                      setProofToVerify(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={handleVerifyConfirm}
                  >
                    Verify
                  </Button>
                </div>
              )}

              {verifyResult === "verifying" && (
                <div className="flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {(verifyResult === "success" || verifyResult === "error") && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setProofToVerify(null);
                    setVerifyResult("idle");
                  }}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
