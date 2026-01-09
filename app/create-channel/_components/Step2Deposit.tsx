/**
 * Step 2: Deposit
 *
 * MPT Key generation and deposit for leader and participants
 */

"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAccount,
  useSignMessage,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
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
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { deriveL2KeysAndAddressFromSignature } from "@/lib/tokamakl2js";
import { ERC20_ABI } from "@/lib/erc20";
import { FIXED_TARGET_CONTRACT, getContractAbi } from "@tokamak/config";
import { useBridgeDepositManagerAddress } from "@/hooks/contract/useBridgeDepositManager";

function Step2DepositContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const channelId = useChannelFlowStore((state) => state.channelId);
  const setChannelId = useChannelFlowStore((state) => state.setChannelId);
  const participants = useChannelFormStore((state) => state.participants);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const {
    deposits,
    currentUserDeposit,
    setChannelId: setDepositStoreChannelId,
    setCurrentUserDepositAmount,
    setCurrentUserMPTKey,
    setDepositing,
    setDeposit,
    setNeedsApproval,
    setApproving,
    setDepositTxHash,
    setDepositError,
    areAllDepositsComplete,
  } = useDepositStore();

  const [mptKey, setMptKey] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isGeneratingMPTKey, setIsGeneratingMPTKey] = useState(false);
  const [mptKeyError, setMptKeyError] = useState<string>("");

  // Get token address (from selected channel or use FIXED_TARGET_CONTRACT)
  const tokenAddress = useMemo(() => {
    return (
      (selectedChannel?.targetContract as `0x${string}`) ||
      FIXED_TARGET_CONTRACT
    );
  }, [selectedChannel?.targetContract]);

  // Get BridgeDepositManager address for approval
  const depositManagerAddress = useBridgeDepositManagerAddress();

  // Validate amount input
  const isValidAmount = useCallback((amount: string): boolean => {
    if (!amount || amount === "" || amount === "0") return false;
    try {
      const num = parseFloat(amount);
      return num > 0 && isFinite(num) && !isNaN(num);
    } catch {
      return false;
    }
  }, []);

  // Parse input amount to BigInt (assuming 18 decimals)
  const parseInputAmount = useCallback((amount: string): bigint => {
    try {
      if (!amount || amount === "") return BigInt(0);
      return parseUnits(amount, 18);
    } catch {
      return BigInt(0);
    }
  }, []);

  // Check ERC20 token balance
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  // Check ERC20 token allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && depositManagerAddress
        ? [address, depositManagerAddress]
        : undefined,
    query: {
      enabled:
        !!address &&
        !!tokenAddress &&
        !!depositManagerAddress &&
        isValidAmount(depositAmount),
    },
  });

  // Calculate if approval is needed
  const needsApproval = useMemo(() => {
    if (!allowance || !isValidAmount(depositAmount)) return false;
    const amount = parseInputAmount(depositAmount);
    return amount > allowance;
  }, [allowance, depositAmount, isValidAmount, parseInputAmount]);

  // Update store when needsApproval changes
  useEffect(() => {
    setNeedsApproval(needsApproval);
  }, [needsApproval, setNeedsApproval]);

  // Prepare approve transaction
  const { writeContract: writeApprove, data: approveTxHash } =
    useWriteContract();
  const { isLoading: isApproving, isSuccess: approvalSuccess } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  // Update approving state
  useEffect(() => {
    setApproving(isApproving);
  }, [isApproving, setApproving]);

  // Get BridgeDepositManager ABI
  const depositManagerAbi = getContractAbi("BridgeDepositManager");

  // Prepare deposit transaction
  const { writeContract: writeDeposit, data: depositTxHash } =
    useWriteContract();
  const {
    isLoading: isWaitingDeposit,
    isSuccess: depositSuccess,
    error: depositTxError,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Update depositing state
  useEffect(() => {
    setDepositing(isWaitingDeposit);
  }, [isWaitingDeposit, setDepositing]);

  // Update deposit tx hash
  useEffect(() => {
    if (depositTxHash) {
      setDepositTxHash(depositTxHash);
    }
  }, [depositTxHash, setDepositTxHash]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && depositTxHash && channelId && address) {
      const amount = parseInputAmount(depositAmount);
      setDeposit(address.toLowerCase(), {
        amount,
        mptKey,
        completed: true,
        txHash: depositTxHash,
      });
      setDepositing(false);
      console.log("✅ Deposit completed successfully:", depositTxHash);
    }
  }, [
    depositSuccess,
    depositTxHash,
    channelId,
    address,
    depositAmount,
    mptKey,
    parseInputAmount,
    setDeposit,
    setDepositing,
  ]);

  // Handle deposit error
  useEffect(() => {
    if (depositTxError) {
      setDepositError(depositTxError.message || "Deposit transaction failed");
      setDepositing(false);
      console.error("❌ Deposit error:", depositTxError);
    }
  }, [depositTxError, setDepositError, setDepositing]);

  // Handle approve
  const handleApprove = useCallback(async () => {
    if (
      !tokenAddress ||
      !depositManagerAddress ||
      !isValidAmount(depositAmount)
    )
      return;

    try {
      const amount = parseInputAmount(depositAmount);
      await writeApprove({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [depositManagerAddress, amount],
      });
    } catch (error) {
      console.error("Error approving token:", error);
    }
  }, [
    tokenAddress,
    depositManagerAddress,
    depositAmount,
    isValidAmount,
    parseInputAmount,
    writeApprove,
  ]);

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

  // Load channel data if channelId exists but channel not selected
  useEffect(() => {
    if (channelId && !selectedChannel) {
      // Try to fetch channel data
      fetch(`/api/channels/${channelId.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedChannel(data.data);
          }
        })
        .catch(console.error);
    }
  }, [channelId, selectedChannel]);

  // Generate MPT Key using wallet signature (client-side, matching original manager app)
  const generateMPTKey = useCallback(async () => {
    console.log("🚀 generateMPTKey called (client-side)", {
      isConnected,
      address,
      channelId: channelId?.toString(),
      signMessageAsync: !!signMessageAsync,
      slotIndex: 0, // Fixed to 0
    });

    if (!isConnected || !address) {
      setMptKeyError("Please connect your wallet first");
      console.error("❌ Wallet not connected");
      return;
    }

    if (!channelId) {
      setMptKeyError("Please select a channel first");
      console.error("❌ Channel ID not set");
      return;
    }

    if (!signMessageAsync) {
      setMptKeyError(
        "Wallet signing not available. Please reconnect your wallet."
      );
      console.error("❌ signMessageAsync not available");
      return;
    }

    setIsGeneratingMPTKey(true);
    setMptKeyError("");

    try {
      const message = L2_PRV_KEY_MESSAGE + channelId.toString();
      console.log("📝 Signing message:", message);

      const signature = await signMessageAsync({ message });
      console.log("✅ Signature received:", signature);

      // Generate MPT key directly in browser (client-side)
      console.log("🔑 Generating MPT key in browser...");
      const accountL2 = deriveL2KeysAndAddressFromSignature(
        signature,
        0 // Slot index fixed to 0
      );
      console.log("✅ MPT key generated:", accountL2);

      setMptKey(accountL2.mptKey);
      setCurrentUserMPTKey(accountL2.mptKey);
      setMptKeyError("");
      console.log("✨ MPT Key set successfully:", accountL2.mptKey);
    } catch (err) {
      console.error("❌ Error generating MPT key:", err);
      if (err instanceof Error) {
        if (
          err.message.includes("User rejected") ||
          err.message.includes("rejected")
        ) {
          setMptKeyError("Signature cancelled by user");
        } else if (
          err.message.includes("ConnectorNotFoundError") ||
          err.message.includes("Connector not found")
        ) {
          setMptKeyError(
            "Wallet connection lost. Please disconnect and reconnect your wallet."
          );
        } else if (err.message.includes("ChainMismatchError")) {
          setMptKeyError(
            "Wrong network. Please switch to the correct network."
          );
        } else {
          setMptKeyError(`Error: ${err.message}`);
        }
      } else {
        setMptKeyError("Failed to generate MPT key. Please try again.");
      }
    } finally {
      setIsGeneratingMPTKey(false);
    }
  }, [isConnected, address, channelId, signMessageAsync, setCurrentUserMPTKey]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!depositAmount || !mptKey || !channelId || !address) {
      console.error("Missing required fields for deposit");
      return;
    }

    if (needsApproval && !approvalSuccess) {
      console.error("Approval required before deposit");
      setDepositError("Please approve token spending first");
      return;
    }

    console.log("Depositing...", {
      channelId: channelId.toString(),
      amount: depositAmount,
      mptKey,
    });

    setDepositing(true);
    setDepositError(null);

    try {
      const amount = parseInputAmount(depositAmount);
      const mptKeyBytes32 = mptKey as `0x${string}`;

      await writeDeposit({
        address: depositManagerAddress,
        abi: depositManagerAbi,
        functionName: "depositToken",
        args: [channelId, amount, mptKeyBytes32],
      });
    } catch (error) {
      console.error("Error depositing token:", error);
      setDepositError(
        error instanceof Error ? error.message : "Deposit transaction failed"
      );
      setDepositing(false);
    }
  }, [
    depositAmount,
    mptKey,
    channelId,
    address,
    needsApproval,
    approvalSuccess,
    parseInputAmount,
    writeDeposit,
    depositManagerAddress,
    depositManagerAbi,
    setDepositing,
    setDepositError,
  ]);

  // Get participants from selected channel or form store
  const channelParticipants: string[] =
    selectedChannel?.participants || participants.map((p) => p.address);

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
              <p className="text-sm text-gray-600">
                Channel ID: {channelId.toString()}
              </p>
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
                onClick={() => {
                  console.log("🔘 Generate button clicked!");
                  generateMPTKey();
                }}
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
            currentUserDeposit.isDepositing ||
            !!currentUserDeposit.txHash ||
            (needsApproval && !approvalSuccess)
          }
          className="w-full"
        >
          {currentUserDeposit.isDepositing
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

export function Step2Deposit() {
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
      <Step2DepositContent />
    </Suspense>
  );
}
