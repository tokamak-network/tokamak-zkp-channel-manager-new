/**
 * State Explorer Layout
 *
 * Common layout for all state explorer pages
 * Shows channel header and leader actions
 */

"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Button } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { AppLayout } from "@/components/AppLayout";
import { formatAddress } from "@/lib/utils/format";

type ChannelState = "not-initialized" | "active" | "closed";

export default function StateExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Auto-redirect based on channel state
  useEffect(() => {
    if (!channelId) return;

    const currentPath = window.location.pathname;
    
    if (channelState === "not-initialized" && !currentPath.includes("/deposit")) {
      router.replace("/state-explorer/deposit");
    } else if (channelState === "active" && !currentPath.includes("/transaction")) {
      router.replace("/state-explorer/transaction");
    } else if (channelState === "closed" && !currentPath.includes("/withdraw")) {
      router.replace("/state-explorer/withdraw");
    }
  }, [channelState, channelId, router]);

  if (!channelId) {
    return (
      <AppLayout>
        <div className="text-center py-12 space-y-4">
          <p className="text-gray-500">No channel selected</p>
          <Button onClick={() => router.push("/join-channel")}>
            Join a Channel
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleInitializeState = () => {
    // TODO: Implement initialize state
    console.log("Initialize state for channel:", channelId);
    setChannelState("active");
    router.push("/state-explorer/transaction");
  };

  const handleCloseChannel = () => {
    // TODO: Implement close channel
    console.log("Close channel:", channelId);
    setChannelState("closed");
    router.push("/state-explorer/withdraw");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Channel #{formatAddress(channelId)}</h1>
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

        {/* Page Content */}
        <div className="mt-8">{children}</div>
      </div>
    </AppLayout>
  );
}
