/**
 * Hook to get previous state snapshot for a channel
 *
 * This hook fetches the previous state snapshot in the following order:
 * 1. From bundleData (if available)
 * 2. From API (latest verified proof)
 * 3. From on-chain (initial state for first transfer)
 */

import { useState, useCallback } from "react";
import { useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
import { useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";
import { StateSnapshot } from "tokamak-l2js";
import { addHexPrefix } from "@ethereumjs/util";

interface UsePreviousStateSnapshotParams {
  channelId: string | null;
  bundleSnapshot?: StateSnapshot | null;
}

interface UsePreviousStateSnapshotReturn {
  previousStateSnapshot: StateSnapshot | null;
  isLoading: boolean;
  error: string | null;
  fetchSnapshot: () => Promise<StateSnapshot | null>;
}

/**
 * Hook to fetch previous state snapshot for a channel
 */
export function usePreviousStateSnapshot({
  channelId,
  bundleSnapshot,
}: UsePreviousStateSnapshotParams): UsePreviousStateSnapshotReturn {
  const config = useConfig();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();
  const [previousStateSnapshot, setPreviousStateSnapshot] =
    useState<StateSnapshot | null>(bundleSnapshot || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async (): Promise<StateSnapshot | null> => {
    if (!channelId) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Use bundleSnapshot if available
      if (bundleSnapshot) {
        setPreviousStateSnapshot(bundleSnapshot);
        setIsLoading(false);
        return bundleSnapshot;
      }

      // Step 2: Try to get from latest verified proof API
      try {
        const response = await fetch(
          `/api/get-latest-state-snapshot?channelId=${channelId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.snapshot) {
            setPreviousStateSnapshot(data.snapshot);
            setIsLoading(false);
            return data.snapshot;
          }
        }
      } catch (apiError) {
        console.warn("Failed to fetch snapshot from API:", apiError);
      }

      // Step 3: Fetch initial state from on-chain (first transfer simulation)
      // channelId is now bytes32 (0x... string), not a number
      const channelIdBytes32 = channelId.startsWith("0x")
        ? (channelId as `0x${string}`)
        : (`0x${channelId}` as `0x${string}`);

      // Get channel info and participants using readContract
      const [channelInfo, participants] = await Promise.all([
        readContract(config, {
          address: bridgeCoreAddress,
          abi: bridgeCoreAbi,
          functionName: "getChannelInfo",
          args: [channelIdBytes32],
        }) as Promise<readonly [`0x${string}`, number, bigint, `0x${string}`]>,
        readContract(config, {
          address: bridgeCoreAddress,
          abi: bridgeCoreAbi,
          functionName: "getChannelParticipants",
          args: [channelIdBytes32],
        }) as Promise<readonly `0x${string}`[]>,
      ]);

      const [targetContract, state, participantCount, initialRoot] =
        channelInfo;

      // Get pre-allocated keys using readContract
      const preAllocatedKeys = (await readContract(config, {
        address: bridgeCoreAddress,
        abi: bridgeCoreAbi,
        functionName: "getPreAllocatedKeys",
        args: [targetContract],
      })) as readonly `0x${string}`[] | undefined;

      const registeredKeys: string[] = [];
      const preAllocatedLeaves: Array<{ key: string; value: string }> = [];

      // Fetch pre-allocated leaves using readContract
      if (preAllocatedKeys && preAllocatedKeys.length > 0) {
        const preAllocatedLeafResults = await Promise.all(
          preAllocatedKeys.map((key) =>
            readContract(config, {
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getPreAllocatedLeaf",
              args: [targetContract, key],
            })
          )
        );

        preAllocatedKeys.forEach((key, index) => {
          let keyHex: string;
          const keyValue = key as `0x${string}` | bigint | string;
          if (typeof keyValue === "string") {
            keyHex = keyValue.startsWith("0x") ? keyValue : `0x${keyValue}`;
            if (keyHex.length < 66) {
              const hexPart = keyHex.slice(2);
              keyHex = `0x${hexPart.padStart(64, "0")}`;
            }
          } else if (typeof keyValue === "bigint") {
            keyHex = `0x${keyValue.toString(16).padStart(64, "0")}`;
          } else {
            keyHex = `0x${String(keyValue).padStart(64, "0")}`;
          }

          registeredKeys.push(keyHex);

          const result = preAllocatedLeafResults[index] as
            | readonly [bigint, boolean]
            | undefined;
          if (result) {
            const [value, exists] = result;
            if (exists) {
              const valueHex = `0x${value.toString(16).padStart(64, "0")}`;
              preAllocatedLeaves.push({ key: keyHex, value: valueHex });
            }
          }
        });
      }

      // Fetch participants' MPT keys and deposits using readContract
      const storageEntries: Array<{ key: string; value: string }> = [];

      if (participants.length > 0) {
        const participantDataResults = await Promise.all(
          participants.flatMap((participant) => [
            readContract(config, {
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getL2MptKey",
              args: [channelIdBytes32, participant],
            }) as Promise<bigint>,
            readContract(config, {
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getParticipantDeposit",
              args: [channelIdBytes32, participant],
            }) as Promise<bigint>,
          ])
        );

        participants.forEach((participant, index) => {
          const mptKey = participantDataResults[index * 2] as bigint;
          const deposit = participantDataResults[index * 2 + 1] as bigint;

          if (mptKey && deposit) {
            const mptKeyHex = `0x${mptKey.toString(16).padStart(64, "0")}`;
            const depositHex = `0x${deposit.toString(16).padStart(64, "0")}`;

            registeredKeys.push(mptKeyHex);
            storageEntries.push({ key: mptKeyHex, value: depositHex });
          }
        });
      }

      // StateSnapshot expects channelId as number, but we're using bytes32 now
      // For compatibility, we'll use 0 as a placeholder since channelId is bytes32
      // The actual channelId is tracked separately in the application
      const snapshot: StateSnapshot = {
        channelId: 0, // Placeholder - channelId is now bytes32, not a number
        stateRoot: initialRoot,
        registeredKeys,
        storageEntries,
        contractAddress: targetContract,
        preAllocatedLeaves,
      };

      setPreviousStateSnapshot(snapshot);
      setIsLoading(false);
      return snapshot;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch previous state snapshot";
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(
        `Could not find previous state snapshot and failed to fetch initial state from on-chain: ${errorMessage}`
      );
    }
  }, [channelId, bundleSnapshot, config, bridgeCoreAddress, bridgeCoreAbi]);

  return {
    previousStateSnapshot,
    isLoading,
    error,
    fetchSnapshot,
  };
}
