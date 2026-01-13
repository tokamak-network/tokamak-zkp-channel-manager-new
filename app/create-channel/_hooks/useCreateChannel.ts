/**
 * useCreateChannel Hook
 *
 * Hook for creating a channel with contract interaction
 */

import { useState, useEffect, useCallback } from "react";
import { decodeEventLog, getEventSelector } from "viem";
import {
  useBridgeCoreWrite,
  useBridgeCoreWaitForReceipt,
  useBridgeCoreAbi,
} from "@/hooks/contract";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import { saveChannelToDatabase } from "../_utils/saveChannel";

interface UseCreateChannelParams {
  participants: Array<{ address: `0x${string}` }>;
  isValid: () => boolean;
  isConnected: boolean;
  channelId: `0x${string}` | null;
}

export function useCreateChannel({
  participants,
  isValid,
  isConnected,
  channelId,
}: UseCreateChannelParams) {
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdChannelId, setCreatedChannelId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  // Contract write hook (address and abi are pre-configured)
  const {
    writeContract,
    isPending: isWriting,
    data: writeTxHash,
    error: writeError,
  } = useBridgeCoreWrite();

  // Wait for transaction confirmation
  const {
    isLoading: isWaiting,
    isSuccess,
    data: receipt,
    error: waitError,
  } = useBridgeCoreWaitForReceipt({
    hash: writeTxHash,
    query: {
      enabled: !!writeTxHash,
      retry: true,
    },
  });

  // Get ABI for decoding
  const abi = useBridgeCoreAbi();

  // Update states based on contract hooks
  useEffect(() => {
    setIsCreating(isWriting);
  }, [isWriting]);

  useEffect(() => {
    setIsConfirming(isWaiting);
  }, [isWaiting]);

  useEffect(() => {
    if (writeTxHash) {
      setTxHash(writeTxHash);
    }
  }, [writeTxHash]);

  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setIsCreating(false);
    } else if (waitError) {
      setError(waitError.message);
      setIsConfirming(false);
      setIsCreating(false);
    }
  }, [writeError, waitError]);

  // Handle successful channel creation
  const handleChannelCreated = useCallback(async () => {
    if (!receipt || !isSuccess) return;

    try {
      let channelIdBytes32: `0x${string}` | null = null;

      // Get ChannelOpened event selector for filtering
      // Event signature: ChannelOpened(bytes32 indexed channelId, address targetContract)
      const channelOpenedSelector = getEventSelector(
        "ChannelOpened(bytes32,address)"
      );

      // Look for ChannelOpened event in the logs
      if (receipt.logs && receipt.logs.length > 0) {
        console.log(
          `🔍 Searching for ChannelOpened event in ${receipt.logs.length} logs...`
        );

        for (const log of receipt.logs) {
          // Filter by event selector (first topic)
          if (log.topics && log.topics[0] === channelOpenedSelector) {
            try {
              const decoded = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                eventName: "ChannelOpened",
              });

              console.log("✅ Decoded ChannelOpened event:", decoded);

              if (
                decoded.eventName === "ChannelOpened" &&
                decoded.args &&
                typeof decoded.args === "object" &&
                "channelId" in decoded.args
              ) {
                const args = decoded.args as { channelId: `0x${string}` };
                if (
                  typeof args.channelId === "string" &&
                  args.channelId.startsWith("0x")
                ) {
                  channelIdBytes32 = args.channelId as `0x${string}`;
                  console.log(
                    `✅ Found channel ID (bytes32): ${channelIdBytes32}`
                  );
                  break;
                }
              }
            } catch (e) {
              console.error("❌ Error decoding ChannelOpened event:", e);
              // Continue to next log
              continue;
            }
          }
        }
      } else {
        console.warn("⚠️ No logs found in transaction receipt");
      }

      if (channelIdBytes32 === null) {
        console.error(
          "❌ ChannelOpened event not found. Receipt logs:",
          receipt.logs
        );
        throw new Error("ChannelOpened event not found in transaction logs");
      }

      // Convert bytes32 channelId to string for storage
      // Note: channelId is bytes32, we'll use it as hex string
      const channelIdStr = channelIdBytes32;
      // Filter out empty addresses for DB save
      const validParticipants = participants.filter(
        (p) =>
          p.address &&
          p.address.length > 0 &&
          /^0x[a-fA-F0-9]{40}$/.test(p.address)
      );

      try {
        await saveChannelToDatabase({
          channelId: channelIdStr,
          txHash: receipt.transactionHash,
          targetContract: FIXED_TARGET_CONTRACT,
          participants: validParticipants.map((p) => p.address),
          blockNumber: receipt.blockNumber.toString(),
        });
      } catch (dbError) {
        console.error("Error saving channel to database:", dbError);
        // Don't throw - channel is created on-chain, DB save is secondary
      }

      // Set created channel ID and transaction hash
      setCreatedChannelId(channelIdStr);
      setTxHash(receipt.transactionHash); // Ensure txHash is set from receipt
      setIsConfirming(false);
      setIsCreating(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to extract channel ID from transaction";
      setError(errorMessage);
      setIsConfirming(false);
      setIsCreating(false);
    }
  }, [receipt, isSuccess, abi, participants]);

  useEffect(() => {
    if (receipt && isSuccess) {
      handleChannelCreated();
    }
  }, [receipt, isSuccess, handleChannelCreated]);

  // Create channel function
  const createChannel = useCallback(async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    // Filter out empty addresses
    const validParticipants = participants.filter(
      (p) =>
        p.address &&
        p.address.length > 0 &&
        /^0x[a-fA-F0-9]{40}$/.test(p.address)
    );

    if (validParticipants.length < 2) {
      setError("Please add at least 2 valid participant addresses");
      return;
    }

    if (!channelId) {
      setError("Please generate a channel ID first");
      return;
    }

    try {
      setError(null);
      setIsCreating(true);
      setCreatedChannelId(null);

      const channelParams = {
        channelId: channelId,
        targetContract: FIXED_TARGET_CONTRACT,
        whitelisted: validParticipants.map((p) => p.address),
        enableFrostSignature: false,
      };

      await writeContract({
        functionName: "openChannel",
        args: [channelParams],
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create channel";
      setError(errorMessage);
      setIsCreating(false);
    }
  }, [isConnected, participants, channelId, writeContract]);

  // Reset function
  const reset = useCallback(() => {
    setIsCreating(false);
    setIsConfirming(false);
    setError(null);
    setCreatedChannelId(null);
    setTxHash("");
  }, []);

  return {
    createChannel,
    isCreating,
    isConfirming,
    error,
    createdChannelId,
    txHash,
    reset,
  };
}
