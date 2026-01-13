/**
 * Step 2: Deposit
 *
 * MPT Key generation and deposit for leader and participants
 */

"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  useChannelFlowStore,
  useDepositStore,
  useChannelFormStore,
} from "@/stores";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
} from "@tokamak/ui";
import { ChannelSelector } from "./ChannelSelector";
import type { Channel } from "@/lib/db";
import { useGenerateMptKey } from "@/app/state-explorer/deposit/_hooks/useGenerateMptKey";
import { useDeposit } from "../_hooks/useDeposit";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import { useBridgeDepositManagerAddress } from "@/hooks/contract";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { parseInputAmount, isValidAmount } from "@/lib/utils/format";

function DepositFormContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const channelId = useChannelFlowStore((state) => state.channelId);
  const setChannelId = useChannelFlowStore((state) => state.setChannelId);
  const participants = useChannelFormStore((state) => state.participants);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Get channel info from blockchain
  const channelInfo = useChannelInfo(channelId);

  const {
    deposits,
    currentUserDeposit,
    setChannelId: setDepositStoreChannelId,
    setCurrentUserDepositAmount,
    setCurrentUserMPTKey,
    areAllDepositsComplete,
  } = useDepositStore();

  const [mptKey, setMptKey] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // MPT Key generation hook
  const {
    generateMPTKey: generateMPTKeyHook,
    isGenerating: isGeneratingMPTKey,
    error: mptKeyError,
  } = useGenerateMptKey();

  // Get token address (from blockchain channel info or fallback to FIXED_TARGET_CONTRACT)
  const tokenAddress = useMemo(() => {
    return (
      channelInfo.targetContract ||
      (selectedChannel?.targetContract as `0x${string}`) ||
      FIXED_TARGET_CONTRACT
    );
  }, [channelInfo.targetContract, selectedChannel?.targetContract]);

  // Get BridgeDepositManager address for approval
  const depositManagerAddress = useBridgeDepositManagerAddress();

  // Token approval hook
  const {
    needsApproval,
    isApproving,
    approvalSuccess,
    handleApprove,
    isValidAmount,
  } = useTokenApproval({
    tokenAddress,
    spenderAddress: depositManagerAddress,
    depositAmount,
  });

  // Token balance hook
  const { balance } = useTokenBalance({ tokenAddress });

  // Deposit hook
  const { handleDeposit, isDepositing, depositTxHash } = useDeposit({
    channelId,
    depositAmount,
    mptKey,
    needsApproval,
    approvalSuccess,
  });

  // Handle channel selection
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    if (channel.channelId) {
      const id = BigInt(channel.channelId);
      setChannelId(id);
      setDepositStoreChannelId(id);

      // Update participants from selected channel
      if (channel.participants && channel.participants.length > 0) {
        // Note: This would need to update useChannelFormStore if needed
        // For now, we'll use the participants from the selected channel
      }

      // Update URL to include channelId for refresh support
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("channelId", channel.channelId);
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  // Initialize deposit store with channelId
  useEffect(() => {
    if (channelId) {
      setDepositStoreChannelId(channelId);
    }
  }, [channelId, setDepositStoreChannelId]);

  // Check URL parameter for channelId
  useEffect(() => {
    const channelIdParam = searchParams.get("channelId");
    if (channelIdParam) {
      try {
        const id = BigInt(channelIdParam);
        setChannelId(id);
        setDepositStoreChannelId(id);
      } catch (error) {
        console.error("Invalid channelId parameter:", error);
      }
    }
  }, [searchParams, setChannelId, setDepositStoreChannelId]);

  // Load channel data from DB as fallback if channelId exists but channel not selected
  // Note: Primary source is now blockchain via useChannelInfo hook
  useEffect(() => {
    if (channelId && !selectedChannel && !channelInfo.isLoading) {
      // Try to fetch channel data from DB as fallback (for metadata not on-chain)
      fetch(`/api/channels/${channelId.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedChannel(data.data);
          }
        })
        .catch(console.error);
    }
  }, [channelId, selectedChannel, channelInfo.isLoading]);

  // Generate MPT Key handler
  const handleGenerateMPTKey = useCallback(async () => {
    const generatedKey = await generateMPTKeyHook();
    if (generatedKey) {
      setMptKey(generatedKey);
    }
  }, [generateMPTKeyHook]);

  // Get participants from blockchain channel info, selected channel (DB), or form store
  const channelParticipants: string[] = useMemo(() => {
    if (channelInfo.participants && channelInfo.participants.length > 0) {
      return channelInfo.participants;
    }
    if (
      selectedChannel?.participants &&
      selectedChannel.participants.length > 0
    ) {
      return selectedChannel.participants;
    }
    return participants.map((p) => p.address);
  }, [channelInfo.participants, selectedChannel?.participants, participants]);

  const allDepositsComplete = areAllDepositsComplete(channelParticipants);

  // Show channel selector if no channel is selected
  if (!channelId && !selectedChannel) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Step 2: Deposit Tokens</h2>
            <p className="text-sm text-gray-600">
              Select a channel to deposit tokens
            </p>
          </CardHeader>
        </Card>
        <ChannelSelector
          onSelectChannel={handleSelectChannel}
          selectedChannelId={undefined}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Step 2: Deposit Tokens</h2>
            {channelId && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Channel ID: {channelId.toString()}
                </p>
                {channelInfo.isLoading ? (
                  <p className="text-xs text-gray-500">
                    Loading channel info...
                  </p>
                ) : channelInfo.error ? (
                  <p className="text-xs text-red-500">
                    Error loading channel: {channelInfo.error.message}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Participants: {channelInfo.participantCount} | State:{" "}
                    {channelInfo.state === 0
                      ? "None"
                      : channelInfo.state === 1
                      ? "Initialized"
                      : channelInfo.state === 2
                      ? "Open"
                      : channelInfo.state === 3
                      ? "Closing"
                      : channelInfo.state === 4
                      ? "Closed"
                      : "Unknown"}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedChannel(null);
              setChannelId(null);
            }}
          >
            Change Channel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MPT Key Generation */}
        <div>
          <Label required>L2 MPT Key</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={mptKey}
                onChange={(e) => {
                  setMptKey(e.target.value);
                  setCurrentUserMPTKey(e.target.value);
                }}
                placeholder="Generate or enter MPT key"
                disabled={isGeneratingMPTKey}
              />
              <Button
                variant="outline"
                onClick={handleGenerateMPTKey}
                disabled={isGeneratingMPTKey || !isConnected || !channelId}
              >
                {isGeneratingMPTKey ? "Generating..." : "Generate"}
              </Button>
            </div>
            {mptKeyError && (
              <p className="text-sm text-red-600 mt-1">{mptKeyError}</p>
            )}
            {!mptKeyError && (
              <p className="text-sm text-gray-500 mt-1">
                MPT key is required for deposit. Generate using your wallet
                signature.
              </p>
            )}
          </div>
        </div>

        {/* Deposit Amount */}
        <div>
          <Label htmlFor="depositAmount" required>
            Deposit Amount
          </Label>
          <Input
            id="depositAmount"
            type="number"
            value={depositAmount}
            onChange={(e) => {
              setDepositAmount(e.target.value);
              setCurrentUserDepositAmount(
                e.target.value ? parseInputAmount(e.target.value) : null
              );
            }}
            placeholder="0.0"
            step="0.000001"
          />
          {balance && (
            <p className="text-sm text-gray-500 mt-1">
              Balance:{" "}
              {balance.toString() === "0"
                ? "0"
                : (Number(balance) / 1e18).toFixed(6)}{" "}
              tokens
            </p>
          )}
        </div>

        {/* Approval Status */}
        {needsApproval && !approvalSuccess && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            <div className="text-center flex items-center justify-center gap-2">
              {isApproving ? (
                <span>Step 1/2: Approving token spending...</span>
              ) : (
                <span>Step 1: Approve token spending first</span>
              )}
            </div>
          </div>
        )}

        {needsApproval && approvalSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            <div className="text-center flex items-center justify-center gap-2">
              <span>✓ Token approved! Now deposit your tokens</span>
            </div>
          </div>
        )}

        {/* Deposit Status */}
        {currentUserDeposit.txHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Deposit completed
            <div className="mt-1 text-xs">
              Tx: {currentUserDeposit.txHash.slice(0, 20)}...
            </div>
          </div>
        )}

        {/* Error */}
        {currentUserDeposit.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {currentUserDeposit.error}
          </div>
        )}

        {/* Approve Button (if needed) */}
        {needsApproval && !approvalSuccess && (
          <Button
            onClick={handleApprove}
            disabled={!isValidAmount(depositAmount) || isApproving}
            className="w-full"
          >
            {isApproving ? "Approving..." : "Approve Token"}
          </Button>
        )}

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={
            !depositAmount ||
            !mptKey ||
            isDepositing ||
            !!currentUserDeposit.txHash ||
            (needsApproval && !approvalSuccess)
          }
          className="w-full"
        >
          {isDepositing
            ? "Depositing..."
            : currentUserDeposit.txHash
            ? "Deposit Completed"
            : "Deposit Tokens"}
        </Button>

        {/* Participants Deposit Status */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Participants Deposit Status</h3>
          <div className="space-y-2">
            {channelParticipants.map((participantAddress, index) => {
              const address = participantAddress;
              const deposit = deposits[address.toLowerCase()];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm font-mono">
                    {address.slice(0, 10)}...
                  </span>
                  <span className="text-sm">
                    {deposit?.txHash ? (
                      <span className="text-green-600">✓ Completed</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Deposits Complete */}
        {allDepositsComplete && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            All participants have completed their deposits. You can proceed to
            Step 3.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DepositForm() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      }
    >
      <DepositFormContent />
    </Suspense>
  );
}
