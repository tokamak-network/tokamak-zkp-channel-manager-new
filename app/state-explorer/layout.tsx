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
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { AppLayout } from "@/components/AppLayout";
import { formatAddress } from "@/lib/utils/format";
import { useInitializeState } from "./_hooks/useInitializeState";
import { InitializeStateConfirmModal } from "./_components/InitializeStateConfirmModal";
import { CloseChannelConfirmModal } from "./_components/CloseChannelConfirmModal";
import { useCloseChannel } from "./_hooks/useCloseChannel";
import { useBridgeCoreRead } from "@/hooks/contract";
import { Copy, Check } from "lucide-react";
import { ChannelStepper } from "./_components/ChannelStepper";

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
  const [copied, setCopied] = useState(false);

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
        String(channelLeader).toLowerCase() === address.toLowerCase()
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

  // Close channel hook
  const {
    closeChannel,
    isProcessing: isClosingChannel,
    isWriting: isWritingClose,
    isWaiting: isWaitingClose,
    closeSuccess,
    closeTxHash,
    error: closeError,
  } = useCloseChannel({
    channelId: channelId as `0x${string}` | null,
  });

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCloseChannelModal, setShowCloseChannelModal] = useState(false);

  // Refetch channel state when close succeeds
  useEffect(() => {
    if (closeSuccess) {
      refetchChannelState();
    }
  }, [closeSuccess, refetchChannelState]);

  // Redirect to home if no channel selected
  useEffect(() => {
    if (!channelId) {
      router.replace("/");
    }
  }, [channelId, router]);

  // Show loading while redirecting
  if (!channelId) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </AppLayout>
    );
  }

  const handleOpenInitializeModal = () => {
    if (!channelId) return;
    setShowConfirmModal(true);
  };

  const handleInitializeState = async () => {
    if (!channelId) return;
    await initializeState();
  };

  const handleCloseModal = async () => {
    setShowConfirmModal(false);
    // Refetch channel state to check if it's now active
    // The page will automatically show transaction component when state changes
    await refetchChannelState();
  };

  const handleOpenCloseChannelModal = () => {
    if (!channelId) return;
    setShowCloseChannelModal(true);
  };

  const handleCloseChannel = async () => {
    if (!channelId) return;

    // TODO: Implement actual close channel logic
    // This should:
    // 1. Get final balances from state snapshot
    // 2. Generate permutation
    // 3. Generate Groth16 proof
    // 4. Call closeChannel with proper params
    
    // For now, just show a placeholder
    // await closeChannel({
    //   finalBalances: [...],
    //   permutation: [...],
    //   proof: { pA: [...], pB: [...], pC: [...] }
    // });
  };

  const handleCloseChannelModalClose = async () => {
    setShowCloseChannelModal(false);
    if (closeSuccess) {
      await refetchChannelState();
    }
  };

  const handleCopyChannelId = async () => {
    if (!channelId) return;

    try {
      await navigator.clipboard.writeText(channelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy channel ID:", err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Header - Channel ID */}
        <div className="flex items-center gap-8">
          <h1
            className="font-mono font-medium text-[#111111]"
            style={{ fontSize: 40, lineHeight: "1.3em" }}
          >
            Channel {formatAddress(channelId)}
          </h1>
          <button
            onClick={handleCopyChannelId}
            className="hover:opacity-70 transition-opacity"
            title={copied ? "Copied!" : "Copy channel ID"}
          >
            {copied ? (
              <Check className="text-[#3EB100]" style={{ width: 40, height: 40 }} />
            ) : (
              <Copy className="text-[#666666]" style={{ width: 40, height: 40 }} />
            )}
          </button>
        </div>

        {/* Channel Progress Stepper */}
        <ChannelStepper
          currentState={contractChannelState}
          channelId={channelId}
          userAddress={address}
        />

        {/* Leader Actions */}
        {isLeader && contractChannelState !== null && (
          <div className="flex gap-6" style={{ width: 544 }}>
            {/* state === 1 (Initialized): Show Initialize State button during deposit phase */}
            {contractChannelState === 1 && (
              <button
                type="button"
                onClick={handleOpenInitializeModal}
                className="flex-1 flex items-center justify-center font-mono font-medium transition-colors"
                style={{
                  height: 40,
                  padding: "16px 24px",
                  borderRadius: 4,
                  border: "1px solid #111111",
                  backgroundColor: "#0FBCBC",
                  color: "#FFFFFF",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                Initialize State
              </button>
            )}
            {/* state === 2 (Open): Show Close Channel button during transaction phase */}
            {contractChannelState === 2 && (
              <button
                type="button"
                onClick={handleOpenCloseChannelModal}
                className="flex-1 flex items-center justify-center font-mono font-medium transition-colors"
                style={{
                  height: 40,
                  padding: "16px 24px",
                  borderRadius: 4,
                  border: "1px solid #111111",
                  backgroundColor: "#999999",
                  color: "#DCDCDC",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                Close Channel
              </button>
            )}
            {/* state === 3 (Closing) or state === 4 (Closed): No buttons during withdraw phase */}
          </div>
        )}

        {/* Page Content */}
        <div>{children}</div>
      </div>

      {/* Initialize State Confirm Modal */}
      {showConfirmModal && channelId && (
        <InitializeStateConfirmModal
          channelId={channelId}
          onInitialize={handleInitializeState}
          isProcessing={isProcessing}
          txHash={initializeTxHash ?? null}
          onClose={handleCloseModal}
        />
      )}

      {/* Close Channel Confirm Modal */}
      {showCloseChannelModal && channelId && (
        <CloseChannelConfirmModal
          channelId={channelId}
          onCloseChannel={handleCloseChannel}
          isProcessing={isClosingChannel}
          txHash={closeTxHash ?? null}
          onClose={handleCloseChannelModalClose}
        />
      )}
    </AppLayout>
  );
}
