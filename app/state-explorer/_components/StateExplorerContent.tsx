/**
 * State Explorer Content
 *
 * Main content component for state explorer
 * Shows different components based on channel state
 */

"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Button } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { DepositSection } from "./DepositSection";
import { TransactionSection } from "./TransactionSection";
import { WithdrawSection } from "./WithdrawSection";

type ChannelState = "not-initialized" | "active" | "closed";

export function StateExplorerContent() {
  const router = useRouter();
  const { address } = useAccount();
  const { currentChannelId } = useChannelFlowStore();
  const channelId = currentChannelId;

  // TODO: Get from contract
  const [channelState, setChannelState] = useState<ChannelState>("not-initialized");
  const [isLeader, setIsLeader] = useState(false);

  // TODO: Fetch channel info from contract to determine:
  // - Channel state (not-initialized, active, closed)
  // - Is current user the leader
  useEffect(() => {
    // Temporary: Set as leader for testing
    setIsLeader(true);
    // Temporary: Set state for testing
    // setChannelState("not-initialized");
  }, [channelId, address]);

  if (!channelId) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-500">No channel selected</p>
        <Button onClick={() => router.push("/join-channel")}>
          Join a Channel
        </Button>
      </div>
    );
  }

  const handleInitializeState = () => {
    // TODO: Implement initialize state
    console.log("Initialize state for channel:", channelId);
    setChannelState("active");
  };

  const handleCloseChannel = () => {
    // TODO: Implement close channel
    console.log("Close channel:", channelId);
    setChannelState("closed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Channel #{channelId}</h1>
      </div>

      {/* Leader Actions */}
      {isLeader && (
        <div className="flex gap-3">
          {channelState === "not-initialized" && (
            <Button onClick={handleInitializeState}>Initialize State</Button>
          )}
          {channelState === "active" && (
            <Button onClick={handleCloseChannel} variant="outline">
              Close Channel
            </Button>
          )}
        </div>
      )}

      {/* Main Content - Changes based on channel state */}
      <div className="mt-8">
        {channelState === "not-initialized" && (
          <DepositSection channelId={channelId} />
        )}
        {channelState === "active" && (
          <TransactionSection channelId={channelId} />
        )}
        {channelState === "closed" && (
          <WithdrawSection channelId={channelId} />
        )}
      </div>
    </div>
  );
}
