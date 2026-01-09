/**
 * Step 1: Create Channel
 *
 * Form for creating a channel transaction
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { decodeEventLog } from "viem";
import { useChannelFormStore, useChannelFlowStore } from "@/stores";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
} from "@tokamak/ui";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import {
  useBridgeCoreWriteContract,
  useBridgeCoreWaitForReceipt,
  useBridgeCoreAbi,
} from "@/hooks/contract";

export function Step1CreateChannel() {
  const { address, isConnected } = useAccount();
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResults, setDbTestResults] = useState<string[] | null>(null);

  const {
    participants,
    targetContract,
    setTargetContract,
    updateParticipant,
    setParticipants,
    isValid,
  } = useChannelFormStore();

  const {
    isCreatingChannel,
    createChannelTxHash,
    isConfirmingCreate,
    createChannelError,
    onChannelCreated,
    setCreatingChannel,
    setCreateChannelTxHash,
    setCreateChannelError,
    setConfirmingCreate,
  } = useChannelFlowStore();

  // Initialize participant count from store
  const MAX_PARTICIPANTS = 128;
  const [participantCount, setParticipantCount] = useState<number>(
    Math.min(MAX_PARTICIPANTS, Math.max(1, participants.length || 1))
  );

  // Set fixed target contract (constant, set once if not already set)
  if (targetContract !== FIXED_TARGET_CONTRACT) {
    setTargetContract(FIXED_TARGET_CONTRACT);
  }

  // Initialize participants on mount (only once)
  useEffect(() => {
    const store = useChannelFormStore.getState();
    if (store.participants.length === 0) {
      const initialCount = Math.min(
        MAX_PARTICIPANTS,
        Math.max(1, participantCount)
      );
      const initialParticipants = Array(initialCount)
        .fill(null)
        .map(() => ({
          address: "" as `0x${string}`,
        }));
      store.setParticipants(initialParticipants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync participants array with participantCount
  useEffect(() => {
    const store = useChannelFormStore.getState();
    const currentCount = store.participants.length;
    const targetCount = Math.min(MAX_PARTICIPANTS, participantCount);

    if (currentCount !== targetCount) {
      // Create new participants array with the target count
      const newParticipants = Array(targetCount)
        .fill(null)
        .map((_, index) => {
          // Keep existing participant if available, otherwise use empty address
          return (
            store.participants[index] || {
              address: "" as `0x${string}`,
            }
          );
        });

      setParticipants(newParticipants);
    }
  }, [participantCount, setParticipants]);

  // Handle participant count change
  const handleParticipantCountChange = (count: number) => {
    const numCount = Math.min(MAX_PARTICIPANTS, Math.max(1, count));
    setParticipantCount(numCount);
  };

  // Prepare contract call parameters
  const channelParams = useMemo(() => {
    if (!isValid() || !isConnected) return undefined;

    return {
      targetContract: FIXED_TARGET_CONTRACT,
      whitelisted: participants.map((p) => p.address),
      enableFrostSignature: false,
    };
  }, [isValid, isConnected, participants]);

  // Contract write hook
  const {
    writeContract,
    isPending: isWriting,
    data: txHash,
    error: writeError,
  } = useBridgeCoreWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isWaiting,
    isSuccess,
    data: receipt,
    error: waitError,
  } = useBridgeCoreWaitForReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
      retry: true,
    },
  });

  // Handle transaction success - extract channel ID and save to database
  // Get ABI only when needed for decoding (used in handleChannelCreated)
  const abi = useBridgeCoreAbi();

  const handleChannelCreated = useCallback(async () => {
    if (!receipt || !isSuccess) return;

    try {
      let channelId: bigint | null = null;

      // Look for ChannelOpened event in the logs
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: abi,
              data: log.data,
              topics: log.topics,
            });

            if (
              decoded.eventName === "ChannelOpened" &&
              decoded.args &&
              typeof decoded.args === "object" &&
              "channelId" in decoded.args
            ) {
              const args = decoded.args as { channelId: bigint };
              if (typeof args.channelId === "bigint") {
                channelId = args.channelId;
                break;
              }
            }
          } catch (e) {
            // Not a ChannelOpened event, continue
            continue;
          }
        }
      }

      if (channelId === null) {
        throw new Error("ChannelOpened event not found in transaction logs");
      }

      // Save channel information to database
      try {
        const channelIdStr = channelId.toString();
        const response = await fetch(`/api/channels/${channelIdStr}/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txHash: receipt.transactionHash,
            targetContract: FIXED_TARGET_CONTRACT,
            participants: participants.map((p) => p.address),
            blockNumber: receipt.blockNumber.toString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to save channel to database:", errorData);
          // Don't throw - channel is created on-chain, DB save is secondary
        } else {
          console.log("Channel information saved to database:", channelIdStr);
        }
      } catch (dbError) {
        console.error("Error saving channel to database:", dbError);
        // Don't throw - channel is created on-chain, DB save is secondary
      }

      // Call onChannelCreated which will update step to 2
      onChannelCreated(channelId);
      setCreateChannelTxHash("");
      setConfirmingCreate(false);
      setCreatingChannel(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to extract channel ID from transaction";
      setCreateChannelError(errorMessage);
      setConfirmingCreate(false);
      setCreatingChannel(false);
    }
  }, [
    receipt,
    isSuccess,
    abi,
    participants,
    onChannelCreated,
    setCreateChannelTxHash,
    setConfirmingCreate,
    setCreatingChannel,
    setCreateChannelError,
  ]);

  useEffect(() => {
    if (receipt && isSuccess) {
      handleChannelCreated();
    }
  }, [receipt, isSuccess, handleChannelCreated]);

  // Update store states based on wagmi hooks
  useEffect(() => {
    setCreatingChannel(isWriting);
  }, [isWriting, setCreatingChannel]);

  useEffect(() => {
    setConfirmingCreate(isWaiting);
  }, [isWaiting, setConfirmingCreate]);

  useEffect(() => {
    if (txHash) {
      setCreateChannelTxHash(txHash);
    }
  }, [txHash, setCreateChannelTxHash]);

  useEffect(() => {
    if (writeError) {
      setCreateChannelError(writeError.message);
      setCreatingChannel(false);
    } else if (waitError) {
      setCreateChannelError(waitError.message);
      setConfirmingCreate(false);
      setCreatingChannel(false);
    }
  }, [
    writeError,
    waitError,
    setCreateChannelError,
    setCreatingChannel,
    setConfirmingCreate,
  ]);

  const handleCreateChannel = async () => {
    if (!channelParams || !isValid() || !isConnected) return;

    try {
      setCreateChannelError(null);
      setCreatingChannel(true);

      await writeContract({
        functionName: "openChannel",
        args: [channelParams],
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create channel";
      setCreateChannelError(errorMessage);
      setCreatingChannel(false);
    }
  };

  const handleTestDb = async () => {
    try {
      setIsTestingDb(true);
      setDbTestResults(null);

      const response = await fetch("/api/db/test", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setDbTestResults(data.results);
      } else {
        setDbTestResults([
          `❌ Test failed: ${data.error || "Unknown error"}`,
          data.details ? `Details: ${data.details}` : "",
        ]);
      }
    } catch (error) {
      setDbTestResults([
        `❌ Test error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ]);
    } finally {
      setIsTestingDb(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Step 1: Create Channel</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Contract */}
        <div>
          <Label htmlFor="targetContract" required>
            Target Contract Address
          </Label>
          <Input
            id="targetContract"
            value={FIXED_TARGET_CONTRACT}
            disabled
            readOnly
          />
        </div>

        {/* Participants */}
        <div>
          <Label htmlFor="participantCount" required>
            Number of Participants
          </Label>
          <Input
            id="participantCount"
            type="number"
            min="1"
            max={MAX_PARTICIPANTS}
            value={participantCount}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 1;
              handleParticipantCountChange(count);
            }}
            placeholder="Enter number of participants"
            className="mb-4"
          />

          <Label required>Participants</Label>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index}>
                <Input
                  value={participant.address}
                  onChange={(e) =>
                    updateParticipant(index, e.target.value as `0x${string}`)
                  }
                  placeholder="Add participant address (0x...)"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Minimum 1 participant required (maximum {MAX_PARTICIPANTS})
          </p>
        </div>

        {/* Error Message */}
        {createChannelError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {createChannelError}
          </div>
        )}

        {/* Transaction Status */}
        {createChannelTxHash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            Transaction: {createChannelTxHash}
            {isConfirmingCreate && " (Confirming...)"}
          </div>
        )}

        {/* DB Test Results */}
        {dbTestResults && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm space-y-1">
            <div className="font-semibold mb-2">DB Test Results:</div>
            {dbTestResults.map((result, index) => (
              <div key={index} className="font-mono text-xs">
                {result}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCreateChannel}
            disabled={!isValid() || isCreatingChannel || isConfirmingCreate}
            className="flex-1"
          >
            {isCreatingChannel || isConfirmingCreate
              ? "Creating Channel..."
              : "Create Channel"}
          </Button>
          <Button
            onClick={handleTestDb}
            disabled={isTestingDb}
            variant="outline"
            className="flex-1"
          >
            {isTestingDb ? "Testing DB..." : "Test DB"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
