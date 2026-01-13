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

// ChannelState enum from contract: 0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed
type ContractChannelState = 0 | 1 | 2 | 3 | 4;

export default function StateExplorerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId } = useChannelFlowStore();
  const [contractChannelState, setContractChannelState] = useState<ContractChannelState | null>(null);

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

  // Show appropriate component based on channel state
  // state === 1 (Initialized): Show deposit page
  // state === 2 (Open): Show transaction page
  // state === 3 (Closing): Show withdraw page
  // state === 4 (Closed): Show withdraw page
  // state === 0 (None): Show deposit page (edge case - channel not properly initialized)
  if (contractChannelState === 1 || contractChannelState === 0) {
    return <DepositPage />;
  } else if (contractChannelState === 2) {
    return <TransactionPage />;
  } else if (contractChannelState === 3 || contractChannelState === 4) {
    return <WithdrawPage />;
  }

  // Fallback (should not reach here)
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Unknown channel state: {contractChannelState}</p>
    </div>
  );
}
