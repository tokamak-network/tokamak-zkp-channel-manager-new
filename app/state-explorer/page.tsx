/**
 * State Explorer Root Page
 *
 * Shows appropriate component based on channel state
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useBridgeCoreRead } from "@/hooks/contract";
import { DepositPage } from "./deposit/page";
import { TransactionPage } from "./transaction/page";
import { WithdrawPage } from "./withdraw/page";
import { State3Page } from "./state3/page";

// ChannelState enum from contract: 0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed
type ContractChannelState = 0 | 1 | 2 | 3 | 4;

export default function StateExplorerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId } = useChannelFlowStore();
  const [contractChannelState, setContractChannelState] =
    useState<ContractChannelState | null>(null);

  // Get channel state from contract
  const { data: channelStateData, isLoading: isLoadingState, refetch: refetchChannelState } =
    useBridgeCoreRead({
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

  // Listen for submit proof success events to refetch channel state
  useEffect(() => {
    const handleProofSubmitSuccess = () => {
      console.log("[StateExplorerPage] Proof submit success detected, refetching channel state...");
      // Refetch channel state with retry logic
      // First attempt after 1 second, then retry every 2 seconds up to 3 times
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptRefetch = () => {
        setTimeout(async () => {
          try {
            const result = await refetchChannelState();
            console.log("[StateExplorerPage] Channel state refetched:", result);
            
            // Check if state changed to 3 (Closing)
            if (result.data !== undefined) {
              const newState = Number(result.data) as ContractChannelState;
              if (newState === 3) {
                console.log("[StateExplorerPage] Channel state changed to 3 (Closing)");
                return; // Success, stop retrying
              }
            }
            
            // If state hasn't changed yet and we haven't exceeded max retries, try again
            if (retryCount < maxRetries) {
              retryCount++;
              attemptRefetch();
            }
          } catch (error) {
            console.error("[StateExplorerPage] Failed to refetch channel state:", error);
            if (retryCount < maxRetries) {
              retryCount++;
              attemptRefetch();
            }
          }
        }, retryCount === 0 ? 1000 : 2000); // First attempt after 1s, then every 2s
      };
      
      attemptRefetch();
    };

    // Listen for custom event from ProofList component
    window.addEventListener('proof-submit-success', handleProofSubmitSuccess);

    return () => {
      window.removeEventListener('proof-submit-success', handleProofSubmitSuccess);
    };
  }, [refetchChannelState]);

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
      {/* Main Content - Show appropriate component based on channel state */}
      {/* state === 1 (Initialized): Show deposit page */}
      {/* state === 2 (Open): Show transaction page */}
      {/* state === 3 (Closing): Show state3 page with close channel button */}
      {/* state === 4 (Closed): Show withdraw page */}
      {/* state === 0 (None): Show deposit page (edge case - channel not properly initialized) */}
      {(contractChannelState === 1 || contractChannelState === 0) && (
        <DepositPage />
      )}
      {contractChannelState === 2 && <TransactionPage />}
      {contractChannelState === 3 && <State3Page />}
      {contractChannelState === 4 && <WithdrawPage />}

      {/* Fallback */}
      {contractChannelState !== 0 &&
        contractChannelState !== 1 &&
        contractChannelState !== 2 &&
        contractChannelState !== 3 &&
        contractChannelState !== 4 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Unknown channel state: {contractChannelState}
            </p>
          </div>
        )}
    </div>
  );
}
