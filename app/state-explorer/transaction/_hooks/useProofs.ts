/**
 * Custom Hook: useProofs
 *
 * Handles fetching and managing proof list state
 */

import { useState, useEffect, useCallback } from "react";

export interface Proof {
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

interface UseProofsParams {
  channelId: string | null;
}

interface UseProofsReturn {
  proofs: Proof[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing proof list fetching and state
 */
export function useProofs({ channelId }: UseProofsParams): UseProofsReturn {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProofs = useCallback(async () => {
    if (!channelId) {
      setProofs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Normalize channelId to lowercase for consistent DB lookup
      // (DB stores channelId in lowercase format)
      const normalizedChannelId = channelId?.toLowerCase() || channelId;
      const encodedChannelId = normalizedChannelId ? encodeURIComponent(normalizedChannelId) : channelId;
      
      // Fetch all proof types
      const [submittedRes, verifiedRes, rejectedRes] = await Promise.all([
        fetch(`/api/channels/${encodedChannelId}/proofs?type=submitted`),
        fetch(`/api/channels/${encodedChannelId}/proofs?type=verified`),
        fetch(`/api/channels/${encodedChannelId}/proofs?type=rejected`),
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
      setError(err instanceof Error ? err.message : "Failed to load proofs");
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // Auto-fetch when channelId changes
  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  return {
    proofs,
    isLoading,
    error,
    refetch: fetchProofs,
  };
}
