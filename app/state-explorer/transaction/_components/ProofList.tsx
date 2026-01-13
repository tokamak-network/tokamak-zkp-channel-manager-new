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
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Trash2,
  FileCheck,
  AlertTriangle,
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

interface Proof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  subNumber: number;
  submittedAt: string;
  submitter: string;
  status: "pending" | "verified" | "rejected";
  uploadStatus?: string;
  channelId: string;
  zipFile?: {
    filePath: string;
    fileName: string;
    size: number;
  };
}

interface ProofListProps {
  onRefresh?: () => void;
}

export function ProofList({}: ProofListProps) {
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
  const isLeader = channelLeader && address
    ? channelLeader.toLowerCase() === address.toLowerCase()
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

  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProofKey, setDeletingProofKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [proofToDelete, setProofToDelete] = useState<Proof | null>(null);

  // Fetch proofs
  const fetchProofs = async () => {
    if (!currentChannelId) {
      setProofs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all proof types
      const [submittedRes, verifiedRes, rejectedRes] = await Promise.all([
        fetch(`/api/channels/${currentChannelId}/proofs?type=submitted`),
        fetch(`/api/channels/${currentChannelId}/proofs?type=verified`),
        fetch(`/api/channels/${currentChannelId}/proofs?type=rejected`),
      ]);

      const [submittedData, verifiedData, rejectedData] = await Promise.all([
        submittedRes.json(),
        verifiedRes.json(),
        rejectedRes.json(),
      ]);

      const allProofs: Proof[] = [
        ...(submittedData.data || submittedData.proofs || []).map((p: any) => ({
          ...p,
          status: "pending" as const,
        })),
        ...(verifiedData.data || verifiedData.proofs || []).map((p: any) => ({
          ...p,
          status: "verified" as const,
        })),
        ...(rejectedData.data || rejectedData.proofs || []).map((p: any) => ({
          ...p,
          status: "rejected" as const,
        })),
      ];

      // Sort by sequence number and sub number
      allProofs.sort((a, b) => {
        if (a.sequenceNumber !== b.sequenceNumber) {
          return a.sequenceNumber - b.sequenceNumber;
        }
        return a.subNumber - b.subNumber;
      });

      setProofs(allProofs);
    } catch (err) {
      console.error("Failed to fetch proofs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load proofs"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, [currentChannelId]);

  // Calculate statistics
  const stats = {
    total: proofs.length,
    approved: proofs.filter((p) => p.status === "verified").length,
    pending: proofs.filter((p) => p.status === "pending").length,
    rejected: proofs.filter((p) => p.status === "rejected").length,
  };

  // Handle download
  const handleDownload = async (proof: Proof) => {
    try {
      const statusMap: Record<string, string> = {
        pending: "submittedProofs",
        verified: "verifiedProofs",
        rejected: "rejectedProofs",
      };

      const response = await fetch(
        `/api/get-proof-zip?channelId=${currentChannelId}&proofId=${proof.key}&status=${statusMap[proof.status]}&format=binary`
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
    }
  };

  // Handle delete button click - show confirmation modal
  const handleDeleteClick = (proof: Proof) => {
    if (!address || !isLeader) {
      alert("Only the channel leader can delete proofs");
      return;
    }
    setProofToDelete(proof);
    setShowDeleteConfirm(true);
  };

  // Handle confirmed delete
  const handleDeleteConfirm = async () => {
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
    if (!confirm(`This action cannot be undone. Delete ${proofToDelete.proofId}?`)) {
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
          channelId: currentChannelId,
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
      await fetchProofs();
    } catch (err) {
      console.error("Failed to delete proof:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete proof"
      );
    } finally {
      setDeletingProofKey(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).replace(/\./g, ".").replace(/\s/g, "");
    } catch {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

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
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Status */}
                <div className="w-24">{getStatusBadge(proof.status)}</div>

                {/* Proof ID */}
                <div className="font-mono font-medium text-gray-900">
                  {proof.proofId}
                </div>

                {/* Date */}
                <div className="text-sm text-gray-600">
                  {formatDate(proof.submittedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {proof.status === "pending" && isLeader && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileCheck className="w-4 h-4 mr-1" />
                    Verify Proof
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(proof)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Files
                </Button>
                {isLeader && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(proof)}
                    disabled={deletingProofKey === proof.key}
                    className="text-red-600 border-red-200 hover:bg-red-50"
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Proof
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this proof? This action cannot be undone.
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
              onClick={() => {
                setShowDeleteConfirm(false);
                setProofToDelete(null);
              }}
              disabled={deletingProofKey !== null}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleDeleteConfirm}
              disabled={deletingProofKey !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  );
}
