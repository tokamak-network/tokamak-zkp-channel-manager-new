/**
 * useChannelBalance Hook
 *
 * Fetches the current balance for a user in a channel.
 * Balance is determined from:
 * 1. Latest verified proof's state_snapshot (if exists)
 * 2. Initial deposit from on-chain data (if no verified proofs)
 *
 * This is a common hook used by:
 * - AccountPanel (to show current balance)
 * - TransactionPage (to check balance before sending)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import { useBridgeCoreRead, readBridgeCoreContract } from "@/hooks/contract";
import { useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";
import JSZip from "jszip";

export interface ChannelBalanceResult {
  /** Current balance in wei (bigint) */
  balance: bigint | null;
  /** Initial deposit amount from on-chain (bigint) */
  initialDeposit: bigint | null;
  /** User's MPT key in the channel */
  mptKey: string | null;
  /** Source of the balance: 'verified_proof' or 'initial_deposit' */
  source: "verified_proof" | "initial_deposit" | null;
  /** Sequence number of the latest verified proof (if source is 'verified_proof') */
  latestSequenceNumber: number | null;
  /** Whether the data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch the balance */
  refetch: () => Promise<void>;
}

interface UseChannelBalanceParams {
  channelId: string | null;
}

export function useChannelBalance({
  channelId,
}: UseChannelBalanceParams): ChannelBalanceResult {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();

  const [balance, setBalance] = useState<bigint | null>(null);
  const [source, setSource] = useState<
    "verified_proof" | "initial_deposit" | null
  >(null);
  const [latestSequenceNumber, setLatestSequenceNumber] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's MPT key from on-chain
  const { data: mptKeyData, isLoading: isLoadingMptKey } = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args:
      channelId && address
        ? [channelId as `0x${string}`, address as `0x${string}`]
        : undefined,
    query: {
      enabled: !!channelId && !!address && isConnected,
    },
  });

  // Get initial deposit from on-chain
  const { data: initialDepositData, isLoading: isLoadingDeposit } =
    useBridgeCoreRead({
      functionName: "getParticipantDeposit",
      args:
        channelId && address
          ? [channelId as `0x${string}`, address as `0x${string}`]
          : undefined,
      query: {
        enabled: !!channelId && !!address && isConnected,
      },
    });

  const mptKey = mptKeyData
    ? `0x${(mptKeyData as bigint).toString(16).padStart(64, "0")}`
    : null;
  const initialDeposit =
    initialDepositData !== undefined ? (initialDepositData as bigint) : null;

  /**
   * Fetch balance from latest verified proof
   */
  const fetchBalanceFromVerifiedProof = useCallback(async (): Promise<{
    balance: bigint;
    sequenceNumber: number;
  } | null> => {
    if (!channelId || !mptKey) return null;

    try {
      const normalizedChannelId = channelId.toLowerCase();
      const encodedChannelId = encodeURIComponent(normalizedChannelId);

      // Fetch verified proofs from DB
      const proofsResponse = await fetch(
        `/api/channels/${encodedChannelId}/proofs?type=verified`
      );

      if (!proofsResponse.ok) {
        return null;
      }

      const proofsData = await proofsResponse.json();
      if (!proofsData.success || !proofsData.data) {
        return null;
      }

      // Get proofs array and sort by sequence number
      let proofsArray: Array<{ key: string; sequenceNumber: number }> = [];
      if (Array.isArray(proofsData.data)) {
        proofsArray = proofsData.data;
      } else if (proofsData.data && typeof proofsData.data === "object") {
        proofsArray = Object.entries(proofsData.data).map(
          ([key, value]: [string, any]) => ({
            key,
            ...value,
          })
        );
      }

      // Sort by sequence number (descending to get latest first)
      proofsArray.sort(
        (a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0)
      );

      if (proofsArray.length === 0) {
        return null;
      }

      // Get the latest (first after descending sort) proof
      const latestProof = proofsArray[0];
      const proofId = latestProof.key;

      // Load the proof ZIP file
      const zipApiUrl = `/api/get-proof-zip?channelId=${encodeURIComponent(
        normalizedChannelId
      )}&proofId=${encodeURIComponent(proofId)}&status=verifiedProofs&format=binary`;

      const zipResponse = await fetch(zipApiUrl);

      if (!zipResponse.ok) {
        console.error("[useChannelBalance] Failed to load proof ZIP");
        return null;
      }

      const zipBlob = await zipResponse.blob();
      const zipArrayBuffer = await zipBlob.arrayBuffer();
      const zip = await JSZip.loadAsync(zipArrayBuffer);

      // Find and parse state_snapshot.json
      let stateSnapshotJson: string | null = null;
      const files = Object.keys(zip.files);
      for (const filePath of files) {
        const fileName = filePath.split("/").pop()?.toLowerCase();
        if (fileName === "state_snapshot.json") {
          const file = zip.file(filePath);
          if (file) {
            stateSnapshotJson = await file.async("string");
            break;
          }
        }
      }

      if (!stateSnapshotJson) {
        console.error(
          "[useChannelBalance] state_snapshot.json not found in proof ZIP"
        );
        return null;
      }

      const stateSnapshot = JSON.parse(stateSnapshotJson);
      const storageEntries = stateSnapshot.storageEntries || [];

      // Find my balance by MPT key
      const myEntry = storageEntries.find(
        (entry: { key: string; value: string }) =>
          entry.key.toLowerCase() === mptKey.toLowerCase()
      );

      if (!myEntry) {
        // MPT key not found in snapshot - might be a new participant
        return null;
      }

      const balanceValue = BigInt(myEntry.value);

      return {
        balance: balanceValue,
        sequenceNumber: latestProof.sequenceNumber || 0,
      };
    } catch (err) {
      console.error("[useChannelBalance] Error fetching verified proof:", err);
      return null;
    }
  }, [channelId, mptKey]);

  /**
   * Fetch and set the balance
   */
  const refetch = useCallback(async () => {
    if (!channelId || !address || !isConnected) {
      setBalance(null);
      setSource(null);
      setLatestSequenceNumber(null);
      return;
    }

    // Wait for on-chain data to be ready
    if (isLoadingMptKey || isLoadingDeposit) {
      return;
    }

    if (!mptKey) {
      setError("MPT key not found for this user in the channel");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get balance from latest verified proof
      const verifiedResult = await fetchBalanceFromVerifiedProof();

      if (verifiedResult) {
        setBalance(verifiedResult.balance);
        setSource("verified_proof");
        setLatestSequenceNumber(verifiedResult.sequenceNumber);
      } else {
        // Fall back to initial deposit
        if (initialDeposit !== null) {
          setBalance(initialDeposit);
          setSource("initial_deposit");
          setLatestSequenceNumber(null);
        } else {
          setBalance(null);
          setSource(null);
          setLatestSequenceNumber(null);
        }
      }
    } catch (err) {
      console.error("[useChannelBalance] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [
    channelId,
    address,
    isConnected,
    mptKey,
    initialDeposit,
    isLoadingMptKey,
    isLoadingDeposit,
    fetchBalanceFromVerifiedProof,
  ]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    balance,
    initialDeposit,
    mptKey,
    source,
    latestSequenceNumber,
    isLoading: isLoading || isLoadingMptKey || isLoadingDeposit,
    error,
    refetch,
  };
}
