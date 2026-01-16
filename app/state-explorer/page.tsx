/**
 * State Explorer Root Page
 *
 * Shows appropriate component based on channel state
 */

"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [hasWithdrawableAmount, setHasWithdrawableAmount] = useState(false);

  // Store targetContract from API (persists even after cleanupChannel)
  const [targetContractFromApi, setTargetContractFromApi] = useState<
    string | null
  >(null);

  // Get channel state from contract
  const {
    data: channelStateData,
    isLoading: isLoadingState,
    refetch: refetchChannelState,
  } = useBridgeCoreRead({
    functionName: "getChannelState",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  // Get target contract from contract (may be 0x0 after cleanupChannel)
  const { data: targetContractFromContract } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  // Fetch targetContract from API as fallback (stored in DB, persists after cleanupChannel)
  const fetchTargetContractFromApi = useCallback(async () => {
    if (!currentChannelId) return;

    try {
      const response = await fetch(
        `/api/channels/${encodeURIComponent(currentChannelId)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.targetContract) {
          setTargetContractFromApi(data.data.targetContract);
        }
      }
    } catch (error) {
      console.error(
        "[StateExplorerPage] Failed to fetch channel from API:",
        error
      );
    }
  }, [currentChannelId]);

  // Fetch targetContract from API on mount or when channelId changes
  useEffect(() => {
    fetchTargetContractFromApi();
  }, [fetchTargetContractFromApi]);

  // Use contract targetContract if valid, otherwise use API fallback
  const targetContract =
    targetContractFromContract &&
    targetContractFromContract !== "0x0000000000000000000000000000000000000000"
      ? (targetContractFromContract as string)
      : targetContractFromApi;

  // Get withdrawable amount for current user
  // After cleanupChannel, channel state becomes 0 but withdrawable amounts remain
  const { data: withdrawableAmount, refetch: refetchWithdrawable } =
    useBridgeCoreRead({
      functionName: "getWithdrawableAmount",
      args:
        currentChannelId && address && targetContract
          ? [
              currentChannelId as `0x${string}`,
              address as `0x${string}`,
              targetContract as `0x${string}`,
            ]
          : undefined,
      query: {
        enabled:
          !!currentChannelId && !!address && !!targetContract && isConnected,
      },
    });

  // Update hasWithdrawableAmount when withdrawableAmount changes
  useEffect(() => {
    if (withdrawableAmount !== undefined) {
      const amount = BigInt(withdrawableAmount.toString());
      setHasWithdrawableAmount(amount > BigInt(0));
    }
  }, [withdrawableAmount]);

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
      refetchWithRetry(3); // Expect state 3 (Closing)
    };

    const handleChannelCloseSuccess = () => {
      // After verifyFinalBalancesGroth16, cleanupChannel is called which sets state to 0
      // but withdrawable amounts are preserved. So we need to check withdrawable amount.
      refetchWithdrawable();
      refetchWithRetry(0); // After cleanupChannel, state becomes 0
    };

    // Refetch channel state with retry logic
    const refetchWithRetry = (expectedState: ContractChannelState) => {
      let retryCount = 0;
      const maxRetries = 3;

      const attemptRefetch = () => {
        setTimeout(
          async () => {
            try {
              const result = await refetchChannelState();

              if (result.data !== undefined) {
                const newState = Number(result.data) as ContractChannelState;
                if (newState === expectedState) {
                  return; // Success, stop retrying
                }
              }

              // If state hasn't changed yet and we haven't exceeded max retries, try again
              if (retryCount < maxRetries) {
                retryCount++;
                attemptRefetch();
              }
            } catch {
              if (retryCount < maxRetries) {
                retryCount++;
                attemptRefetch();
              }
            }
          },
          retryCount === 0 ? 1000 : 2000
        ); // First attempt after 1s, then every 2s
      };

      attemptRefetch();
    };

    // Listen for custom events
    window.addEventListener("proof-submit-success", handleProofSubmitSuccess);
    window.addEventListener("channel-close-success", handleChannelCloseSuccess);

    return () => {
      window.removeEventListener(
        "proof-submit-success",
        handleProofSubmitSuccess
      );
      window.removeEventListener(
        "channel-close-success",
        handleChannelCloseSuccess
      );
    };
  }, [refetchChannelState, refetchWithdrawable]);

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
      {/* state === 4 (Closed) OR state === 0 with withdrawable amount: Show withdraw page */}
      {/* state === 0 (None) without withdrawable: Show deposit page (new channel) */}

      {/* Withdraw page: state 4 OR state 0 with withdrawable amount (after cleanupChannel) */}
      {(contractChannelState === 4 ||
        (contractChannelState === 0 && hasWithdrawableAmount)) && (
        <WithdrawPage />
      )}

      {/* Deposit page: state 1 OR state 0 without withdrawable (new channel) */}
      {(contractChannelState === 1 ||
        (contractChannelState === 0 && !hasWithdrawableAmount)) && (
        <DepositPage />
      )}

      {/* Transaction page: state 2 */}
      {contractChannelState === 2 && <TransactionPage />}

      {/* State3 page: state 3 */}
      {contractChannelState === 3 && <State3Page />}

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
