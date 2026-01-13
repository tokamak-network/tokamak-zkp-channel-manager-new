/**
 * State Explorer Root Page
 *
 * Shows appropriate component based on channel state
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useBridgeCoreRead } from "@/hooks/contract";
import { Button } from "@tokamak/ui";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { DepositPage } from "./deposit/page";
import { TransactionPage } from "./transaction/page";
import { WithdrawPage } from "./withdraw/page";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { useSubmitProof } from "./_hooks/useSubmitProof";

// ChannelState enum from contract: 0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed
type ContractChannelState = 0 | 1 | 2 | 3 | 4;

export default function StateExplorerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId } = useChannelFlowStore();
  const [contractChannelState, setContractChannelState] = useState<ContractChannelState | null>(null);
  const [showCloseChannel, setShowCloseChannel] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  // Check if user is leader
  const { isLeader } = useChannelInfo(currentChannelId || "");

  // Submit proof hook
  const {
    loadAndSubmit,
    isLoadingProofs,
    isSubmitting,
    error: submitError,
  } = useSubmitProof(currentChannelId || "");

  // Get channel state from contract
  const { data: channelStateData, isLoading: isLoadingState } = useBridgeCoreRead({
    functionName: "getChannelState",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  // Update channel state based on contract
  useEffect(() => {
    if (channelStateData !== undefined) {
      // ChannelState enum: 0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed
      const state = Number(channelStateData) as ContractChannelState;
      setContractChannelState(state);
    }
  }, [channelStateData]);

  // Redirect if no channel selected
  useEffect(() => {
    if (!currentChannelId) {
      router.replace("/join-channel");
    }
  }, [currentChannelId, router]);

  if (!currentChannelId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show loading state while fetching channel state
  if (isLoadingState || contractChannelState === null) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading channel state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leader Actions (shown only when user is leader and channel is Open) */}
      {isLeader && contractChannelState === 2 && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setShowSubmitSuccess(false);
                  await loadAndSubmit();
                  setShowSubmitSuccess(true);
                } catch (error) {
                  console.error('Submit proof error:', error);
                }
              }}
              disabled={isLoadingProofs || isSubmitting}
            >
              {(isLoadingProofs || isSubmitting) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {isLoadingProofs ? 'Loading Proofs...' : isSubmitting ? 'Submitting...' : 'Submit Proof'}
            </Button>
            <Button
              variant="default"
              onClick={() => router.push(`/state-explorer/close-channel?channelId=${currentChannelId}`)}
            >
              Close Channel
            </Button>
          </div>
          
          {/* Success/Error Messages */}
          {showSubmitSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>Proofs submitted successfully!</span>
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{submitError}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Show appropriate component based on channel state */}
      {/* state === 1 (Initialized): Show deposit page */}
      {/* state === 2 (Open): Show transaction page or close channel page */}
      {/* state === 3 (Closing): Show withdraw page */}
      {/* state === 4 (Closed): Show withdraw page */}
      {/* state === 0 (None): Show deposit page (edge case - channel not properly initialized) */}
      {(contractChannelState === 1 || contractChannelState === 0) && <DepositPage />}
      {contractChannelState === 2 && !showCloseChannel && <TransactionPage />}
      {(contractChannelState === 3 || contractChannelState === 4) && <WithdrawPage />}

      {/* Fallback */}
      {contractChannelState !== 0 && contractChannelState !== 1 && contractChannelState !== 2 && contractChannelState !== 3 && contractChannelState !== 4 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Unknown channel state: {contractChannelState}</p>
        </div>
      )}
    </div>
  );
}
