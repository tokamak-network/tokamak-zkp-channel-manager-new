/**
 * Custom Hook: useProofActions
 *
 * Handles all proof-related actions: download, delete, approve, verify
 */

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import JSZip from "jszip";
import type { Proof } from "./useProofs";

interface UseProofActionsParams {
  channelId: string | null;
  proofs: Proof[];
  isLeader: boolean;
  onRefresh: () => Promise<void>;
}

interface UseProofActionsReturn {
  // Download actions
  handleDownloadAllApprovedProofs: () => Promise<void>;
  handleDownload: (proof: Proof) => Promise<void>;
  isDownloadingAllApproved: boolean;
  downloadingProofKey: string | null;

  // Delete actions
  handleDeleteClick: (proof: Proof) => void;
  handleDeleteConfirm: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  proofToDelete: Proof | null;
  setProofToDelete: (proof: Proof | null) => void;
  deletingProofKey: string | null;

  // Approve actions
  handleApproveSelected: () => Promise<void>;
  selectedProofForApproval: string | null;
  setSelectedProofForApproval: (key: string | null) => void;
  isVerifying: boolean;

  // Verify actions
  handleVerifyProof: (proof: Proof) => Promise<void>;
}

/**
 * Hook for managing proof actions
 */
export function useProofActions({
  channelId,
  proofs,
  isLeader,
  onRefresh,
}: UseProofActionsParams): UseProofActionsReturn {
  const { address } = useAccount();

  // Download state
  const [isDownloadingAllApproved, setIsDownloadingAllApproved] = useState(false);
  const [downloadingProofKey, setDownloadingProofKey] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [proofToDelete, setProofToDelete] = useState<Proof | null>(null);
  const [deletingProofKey, setDeletingProofKey] = useState<string | null>(null);

  // Approve state
  const [selectedProofForApproval, setSelectedProofForApproval] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle download all approved proofs
  const handleDownloadAllApprovedProofs = useCallback(async () => {
    if (!channelId) return;

    setIsDownloadingAllApproved(true);

    try {
      // Get all verified proofs
      const verifiedProofs = proofs.filter((p) => p.status === "verified");

      if (verifiedProofs.length === 0) {
        alert("No approved proofs found for this channel.");
        return;
      }

      // Sort by sequence number
      const sortedProofs = [...verifiedProofs].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber
      );

      // Create a new ZIP file to contain all proof ZIPs
      const masterZip = new JSZip();

      // Root folder name - normalize channelId to string
      const channelIdStr = channelId?.toLowerCase() || "";
      const rootFolderName = `channel-${channelIdStr}-all-verified-proofs`;

      // Add each verified proof ZIP to the master ZIP
      for (const proof of sortedProofs) {
        try {
          // Download the proof ZIP file
          const response = await fetch(
            `/api/get-proof-zip?channelId=${channelId}&proofId=${proof.key}&status=verifiedProofs&format=binary`
          );

          if (!response.ok) {
            console.warn(
              `Failed to download proof ${proof.proofId}, skipping...`
            );
            continue;
          }

          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();

          // Create a folder for each proof (proof_1, proof_2, etc.)
          const proofFolderName = `proof_${proof.sequenceNumber}`;
          const proofZip = await JSZip.loadAsync(arrayBuffer);

          // Add all files from the proof ZIP to the master ZIP under rootFolder/proof_N/
          const files = Object.keys(proofZip.files);
          for (const fileName of files) {
            const file = proofZip.files[fileName];
            if (!file.dir) {
              const content = await file.async("uint8array");

              // Extract file name, removing any nested folder paths
              let finalFileName = fileName;
              if (fileName.includes("/")) {
                const parts = fileName.split("/");
                for (let i = parts.length - 1; i >= 0; i--) {
                  if (parts[i] && parts[i].trim() !== "") {
                    finalFileName = parts[i];
                    break;
                  }
                }
              }

              // Add file directly to proof_N folder
              masterZip.file(
                `${rootFolderName}/${proofFolderName}/${finalFileName}`,
                content
              );
            }
          }

          // Also add proof metadata
          const metadata = {
            proofId: proof.proofId,
            sequenceNumber: proof.sequenceNumber,
            timestamp: proof.submittedAt,
            submitter: proof.submitter,
          };
          masterZip.file(
            `${rootFolderName}/${proofFolderName}/proof_metadata.json`,
            JSON.stringify(metadata, null, 2)
          );
        } catch (error) {
          console.error(`Error processing proof ${proof.proofId}:`, error);
        }
      }

      // Generate the master ZIP file
      const masterZipBlob = await masterZip.generateAsync({ type: "blob" });

      // Download the file
      const url = URL.createObjectURL(masterZipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `channel-${channelIdStr}-all-verified-proofs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(
        `Successfully downloaded ${sortedProofs.length} approved proof(s)!`
      );
    } catch (error) {
      console.error("Error downloading approved proofs:", error);
      alert(
        `Failed to download approved proofs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDownloadingAllApproved(false);
    }
  }, [channelId, proofs]);

  // Handle download
  const handleDownload = useCallback(async (proof: Proof) => {
    setDownloadingProofKey(proof.key);

    try {
      const statusMap: Record<string, string> = {
        pending: "submittedProofs",
        verified: "verifiedProofs",
        rejected: "rejectedProofs",
      };

      const response = await fetch(
        `/api/get-proof-zip?channelId=${channelId}&proofId=${
          proof.key
        }&status=${statusMap[proof.status]}&format=binary`
      );

      if (!response.ok) {
        throw new Error("Failed to download proof");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = proof.zipFile?.fileName || `proof-${proof.proofId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download proof:", err);
      alert("Failed to download proof file");
    } finally {
      setDownloadingProofKey(null);
    }
  }, [channelId]);

  // Handle delete button click - show confirmation modal
  const handleDeleteClick = useCallback((proof: Proof) => {
    if (!address || !isLeader) {
      alert("Only the channel leader can delete proofs");
      return;
    }
    setProofToDelete(proof);
    setShowDeleteConfirm(true);
  }, [address, isLeader]);

  // Handle proof verification (test/check only - doesn't persist to DB)
  // This is for testing purposes and doesn't permanently change proof status
  // Returns a promise that resolves on success, rejects on error
  const handleVerifyProof = useCallback(async (proof: Proof) => {
    if (!proof.key || !address) {
      throw new Error("Missing proof key or address");
    }

    setIsVerifying(true);

    try {
      // For testing: Simulate verification without persisting to DB
      // The proof status will remain as "pending" after page refresh
      console.log("Verifying proof (test mode):", proof.proofId);

      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Note: We don't call the API or refresh the proof list
      // This allows users to test verify functionality without permanent changes
    } catch (error) {
      console.error("Error verifying proof:", error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  }, [address]);

  // Handle approve selected proof (leader only - persists to DB)
  const handleApproveSelected = useCallback(async () => {
    if (!selectedProofForApproval || !isLeader || !address) return;

    const proofToApprove = proofs.find(
      (p) => p.key === selectedProofForApproval
    );

    if (!proofToApprove || !proofToApprove.sequenceNumber) {
      return;
    }

    setIsVerifying(true);

    try {
      // Call the approve-proof API which persists to DB
      const response = await fetch("/api/tokamak-zk-evm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve-proof",
          channelId: channelId,
          proofKey: proofToApprove.key,
          sequenceNumber: proofToApprove.sequenceNumber,
          verifierAddress: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve proof");
      }

      const result = await response.json();
      console.log("Proof approved successfully:", result);

      // Refresh proof list
      await onRefresh();
      setSelectedProofForApproval(null);
    } catch (error) {
      console.error("Error approving proof:", error);
      alert(
        `Failed to approve proof: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsVerifying(false);
    }
  }, [selectedProofForApproval, isLeader, address, proofs, channelId, onRefresh]);

  // Handle confirmed delete
  const handleDeleteConfirm = useCallback(async () => {
    if (!proofToDelete || !address || !isLeader) {
      return;
    }

    // First confirmation
    if (!confirm(`Are you sure you want to delete ${proofToDelete.proofId}?`)) {
      setShowDeleteConfirm(false);
      setProofToDelete(null);
      return;
    }

    // Second confirmation
    if (
      !confirm(`This action cannot be undone. Delete ${proofToDelete.proofId}?`)
    ) {
      setShowDeleteConfirm(false);
      setProofToDelete(null);
      return;
    }

    setDeletingProofKey(proofToDelete.key);
    setShowDeleteConfirm(false);

    try {
      const response = await fetch("/api/delete-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channelId,
          proofKey: proofToDelete.key,
          userAddress: address,
          isLeader: isLeader,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete proof");
      }

      // Refresh proof list
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete proof:", err);
      alert(err instanceof Error ? err.message : "Failed to delete proof");
    } finally {
      setDeletingProofKey(null);
    }
  }, [proofToDelete, address, isLeader, channelId, onRefresh]);

  return {
    // Download actions
    handleDownloadAllApprovedProofs,
    handleDownload,
    isDownloadingAllApproved,
    downloadingProofKey,

    // Delete actions
    handleDeleteClick,
    handleDeleteConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    proofToDelete,
    setProofToDelete,
    deletingProofKey,

    // Approve actions
    handleApproveSelected,
    selectedProofForApproval,
    setSelectedProofForApproval,
    isVerifying,

    // Verify actions
    handleVerifyProof,
  };
}
