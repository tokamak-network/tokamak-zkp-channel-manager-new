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
import { useInitializeState } from "./_hooks/useInitializeState";
import { InitializeStateConfirmModal } from "./_components/InitializeStateConfirmModal";
import { useBridgeCoreRead } from "@/hooks/contract";

// ChannelState enum from contract: 0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed
type ContractChannelState = 0 | 1 | 2 | 3 | 4;

export default function StateExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId } = useChannelFlowStore();
  const channelId = currentChannelId;

  // Get channel state from contract
  const { data: contractChannelStateData, refetch: refetchChannelState } =
    useBridgeCoreRead({
      functionName: "getChannelState",
      args: channelId ? [channelId as `0x${string}`] : undefined,
      query: {
        enabled: !!channelId && isConnected,
      },
    });

  // Get channel leader
  const { data: channelLeader } = useBridgeCoreRead({
    functionName: "getChannelLeader",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected,
    },
  });

  // Store contract channel state as number
  const [contractChannelState, setContractChannelState] = useState<ContractChannelState | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  // Update channel state based on contract
  useEffect(() => {
    if (contractChannelStateData !== undefined) {
      const state = Number(contractChannelStateData) as ContractChannelState;
      setContractChannelState(state);
    }
  }, [contractChannelStateData]);

  // Check if current user is leader
  useEffect(() => {
    if (channelLeader && address) {
      setIsLeader(
        channelLeader.toLowerCase() === address.toLowerCase()
      );
    } else {
      setIsLeader(false);
    }
  }, [channelLeader, address]);

  // Initialize state hook
  const {
    initializeState,
    isProcessing,
    isGeneratingProof,
    isWriting,
    isWaiting,
    initializeSuccess,
    initializeTxHash,
    proofStatus,
    error: initializeError,
  } = useInitializeState({
    channelId: channelId as `0x${string}` | null,
  });

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Show modal when initialization succeeds
  useEffect(() => {
    if (initializeSuccess && initializeTxHash) {
      setShowConfirmModal(true);
    }
  }, [initializeSuccess, initializeTxHash]);

  // No auto-redirect needed - page.tsx handles conditional rendering

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

  const handleInitializeState = async () => {
    if (!channelId) return;
    await initializeState();
  };

  const handleConfirmModal = async () => {
    setShowConfirmModal(false);
    // Refetch channel state to check if it's now active
    // The page will automatically show transaction component when state changes
    await refetchChannelState();
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
        {isLeader && contractChannelState !== null && (
          <div className="flex gap-3">
            {/* state === 1 (Initialized): Show Initialize State button during deposit phase */}
            {contractChannelState === 1 && (
              <Button
                onClick={handleInitializeState}
                disabled={isProcessing}
              >
                {isProcessing
                  ? isGeneratingProof
                    ? `Generating Proof... ${proofStatus || ""}`
                    : isWriting
                    ? "Signing Transaction..."
                    : isWaiting
                    ? "Waiting for Confirmation..."
                    : "Processing..."
                  : "Initialize State"}
              </Button>
            )}
            {/* state === 2 (Open): Show Close Channel button during transaction phase */}
            {contractChannelState === 2 && (
              <Button onClick={handleCloseChannel} variant="outline">
                Close Channel
              </Button>
            )}
            {/* state === 3 (Closing) or state === 4 (Closed): No buttons during withdraw phase */}
          </div>
        )}

        {/* Error Message */}
        {initializeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {initializeError}
          </div>
        )}

        {/* Page Content */}
        <div className="mt-8">{children}</div>
      </div>

      {/* Initialize State Confirm Modal */}
      {showConfirmModal && initializeTxHash && channelId && (
        <InitializeStateConfirmModal
          channelId={channelId}
          txHash={initializeTxHash}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmModal}
        />
      )}
    </AppLayout>
  );
}
