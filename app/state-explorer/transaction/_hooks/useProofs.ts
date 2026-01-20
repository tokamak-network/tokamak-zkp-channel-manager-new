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
  submittedAt: string | number; // Unix timestamp (number) or ISO string (string) for backward compatibility
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

  const fetchProofs = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!channelId) {
      setProofs([]);
      if (!silent) setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Normalize channelId to lowercase for consistent DB lookup
      // (DB stores channelId in lowercase format)
      const normalizedChannelId = channelId?.toLowerCase() || channelId;
      const encodedChannelId = normalizedChannelId ? encodeURIComponent(normalizedChannelId) : channelId;
      
      // Fetch all proof types (add silent param to suppress API logs during polling)
      const silentParam = silent ? "&silent=true" : "";
      const [submittedRes, verifiedRes, rejectedRes] = await Promise.all([
        fetch(`/api/channels/${encodedChannelId}/proofs?type=submitted${silentParam}`),
        fetch(`/api/channels/${encodedChannelId}/proofs?type=verified${silentParam}`),
        fetch(`/api/channels/${encodedChannelId}/proofs?type=rejected${silentParam}`),
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
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load proofs");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [channelId]);

  // Auto-fetch when channelId changes
  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  // Poll every 5 seconds for updates (silent mode to avoid flickering)
  useEffect(() => {
    if (!channelId) return;

    const intervalId = setInterval(() => {
      fetchProofs({ silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [channelId, fetchProofs]);

  return {
    proofs,
    isLoading,
    error,
    refetch: fetchProofs,
  };
}
