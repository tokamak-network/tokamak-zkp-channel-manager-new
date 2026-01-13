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
import { useCloseChannel } from "./_hooks/useCloseChannel";
import { useBridgeCoreRead } from "@/hooks/contract";
import { Copy, Check } from "lucide-react";

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

  // Show modal when initialization succeeds
  useEffect(() => {
    if (initializeSuccess && initializeTxHash) {
      setShowConfirmModal(true);
    }
  }, [initializeSuccess, initializeTxHash]);

  // Refetch channel state when close succeeds
  useEffect(() => {
    if (closeSuccess) {
      refetchChannelState();
    }
  }, [closeSuccess, refetchChannelState]);

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

  const handleCloseChannel = async () => {
    if (!channelId) return;

    // TODO: For now, show an error message that final balances, permutation, and proof are required
    // In the future, this should open a modal or navigate to a page where the user can:
    // 1. Upload final state snapshot
    // 2. Generate final balances from snapshot
    // 3. Generate permutation
    // 4. Generate Groth16 proof
    // 5. Submit the close channel transaction
    
    alert(
      "Close Channel functionality requires:\n" +
      "- Final balances for all participants\n" +
      "- Permutation array\n" +
      "- Groth16 proof\n\n" +
      "This feature will be implemented in a future update."
    );
    
    // Uncomment when ready to use:
    // await closeChannel({
    //   finalBalances: [...],
    //   permutation: [...],
    //   proof: { pA: [...], pB: [...], pC: [...] }
    // });
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Channel #{formatAddress(channelId)}</h1>
            <button
              onClick={handleCopyChannelId}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title={copied ? "Copied!" : "Copy channel ID"}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
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
              <Button
                onClick={handleCloseChannel}
                disabled={isClosingChannel}
                variant="outline"
              >
                {isClosingChannel
                  ? isWritingClose
                    ? "Signing Transaction..."
                    : isWaitingClose
                    ? "Waiting for Confirmation..."
                    : "Processing..."
                  : "Close Channel"}
              </Button>
            )}
            {/* state === 3 (Closing) or state === 4 (Closed): No buttons during withdraw phase */}
          </div>
        )}

        {/* Error Messages */}
        {initializeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {initializeError}
          </div>
        )}
        {closeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            Close Channel Error: {closeError}
          </div>
        )}
        {closeSuccess && closeTxHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            Channel closed successfully! Transaction: {closeTxHash}
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
