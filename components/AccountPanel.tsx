/**
 * Account Panel Component
 *
 * Displays wallet connection status and account information
 *
 * Design:
 * - https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3138-233297
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
} from "wagmi";
import { Copy, ChevronDown, LogOut, Loader2 } from "lucide-react";
import { formatAddress } from "@/lib/utils/format";
import { isValidBytes32 } from "@/lib/channelId";
import { useGenerateMptKey } from "@/hooks/useGenerateMptKey";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import { formatUnits } from "viem";

// Token symbol images
import TONSymbol from "@/assets/symbols/TON.svg";

interface AccountPanelProps {
  onClose?: () => void;
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { currentChannelId } = useChannelFlowStore();

  // TON token balance
  const { balance: tonBalance } = useTokenBalance({
    tokenAddress: FIXED_TARGET_CONTRACT,
  });

  // L2 Address calculation state
  const [channelIdInput, setChannelIdInput] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedL2Address, setCopiedL2Address] = useState(false);

  // Transaction history filter state
  const [txFilterType, setTxFilterType] = useState<"all" | "from" | "to">("all");
  const [isTxFilterOpen, setIsTxFilterOpen] = useState(false);

  // Use common hook for L2 address and MPT key generation
  const {
    generate,
    isGenerating: isComputing,
    accountInfo,
  } = useGenerateMptKey({
    channelId: channelIdInput || null,
    slotIndex: 0,
  });

  const l2Address = accountInfo?.l2Address || null;

  const handleCopyL2Address = async () => {
    if (!l2Address) return;
    try {
      await navigator.clipboard.writeText(l2Address);
      setCopiedL2Address(true);
      setTimeout(() => setCopiedL2Address(false), 2000);
    } catch (err) {
      console.error("Failed to copy L2 address:", err);
    }
  };

  const handleConnect = () => {
    const injected = connectors.find((c) => c.id === "injected");
    if (injected) {
      connect({ connector: injected });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const computeL2Address = async () => {
    if (!channelIdInput || !isValidBytes32(channelIdInput)) return;
    await generate();
  };

  // Fetch real transaction history from verified proofs
  const {
    transactions: transactionHistory,
    isLoading: isLoadingHistory,
  } = useTransactionHistory({
    channelId: currentChannelId,
    decimals: 18,
    tokenSymbol: "TON",
  });

  // Filter transactions based on selected filter type
  const filteredTransactions = transactionHistory.filter((tx) => {
    if (txFilterType === "all") return true;
    if (txFilterType === "from") return tx.type === "sent"; // From me = Sent
    if (txFilterType === "to") return tx.type === "received"; // To me = Received
    return true;
  });

  // Filter label mapping
  const filterLabels: Record<"all" | "from" | "to", string> = {
    all: "All",
    from: "From",
    to: "To",
  };

  if (!isConnected) {
    return (
      <div className="font-mono flex flex-col gap-6" style={{ width: "100%" }}>
        <p className="text-[#999999]" style={{ fontSize: 16 }}>
          Connect your wallet to get started
        </p>
        <button
          onClick={handleConnect}
          disabled={isPending}
          className="flex items-center justify-center font-medium text-white transition-colors disabled:opacity-50"
          style={{
            height: 40,
            padding: "16px 24px",
            borderRadius: 4,
            border: "1px solid #111111",
            backgroundColor: "#2A72E5",
            fontSize: 16,
          }}
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return (
    <div
      className="font-mono flex flex-col gap-6"
      style={{ width: "100%" }}
    >
      {/* Header: Address + Copy + Disconnect */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span
            className="font-semibold text-[#111111]"
            style={{ fontSize: 24, lineHeight: "1.3em" }}
          >
            {formatAddress(address)}
          </span>
          <button
            onClick={handleCopyAddress}
            className="hover:opacity-70 transition-opacity"
            title={copiedAddress ? "Copied!" : "Copy address"}
          >
            <Copy
              className={`w-6 h-6 ${copiedAddress ? "text-green-600" : "text-[#111111]"}`}
            />
          </button>
        </div>
        <button
          onClick={() => {
            disconnect();
            onClose?.();
          }}
          className="flex items-center justify-center hover:bg-[#F2F2F2] transition-colors"
          style={{
            width: 48,
            height: 48,
            border: "1px solid #BBBBBB",
            borderRadius: 4,
          }}
          title="Disconnect"
        >
          <LogOut className="w-6 h-6 text-[#111111]" />
        </button>
      </div>

      {/* Balance Section */}
      <div className="flex flex-col gap-4">
        <span
          className="font-medium text-[#111111]"
          style={{ fontSize: 20, lineHeight: "1.3em" }}
        >
          Balance
        </span>
        <div className="flex flex-col">
          {/* ETH Balance */}
          {balance && (
            <div
              className="flex items-center justify-between"
              style={{ padding: "10px 0", borderRadius: 4 }}
            >
              <span
                className="text-[#111111]"
                style={{ fontSize: 18, lineHeight: "1.3em" }}
              >
                {parseFloat(balance.formatted).toFixed(2)}
              </span>
              <span
                className="text-[#111111]"
                style={{ fontSize: 18, lineHeight: "1.3em" }}
              >
                {balance.symbol}
              </span>
            </div>
          )}
          {/* TON Balance */}
          {tonBalance !== undefined && (
            <div
              className="flex items-center justify-between"
              style={{ padding: "10px 0", borderRadius: 4 }}
            >
              <span
                className="text-[#111111]"
                style={{ fontSize: 18, lineHeight: "1.3em" }}
              >
                {parseFloat(formatUnits(tonBalance, 18)).toFixed(2)}
              </span>
              <span
                className="text-[#111111]"
                style={{ fontSize: 18, lineHeight: "1.3em" }}
              >
                TON
              </span>
            </div>
          )}
        </div>
      </div>

      {/* L2 Address Calculator */}
      <div className="flex flex-col gap-4">
        <span
          className="font-medium text-[#111111]"
          style={{ fontSize: 20, lineHeight: "1.3em" }}
        >
          L2 Address Calculator
        </span>

        {/* Input + Calculate Button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Channel ID (0x...)"
            value={channelIdInput}
            onChange={(e) => setChannelIdInput(e.target.value)}
            className="flex-1 font-mono bg-transparent outline-none text-[#111111] placeholder:text-[#999999]"
            style={{
              height: 40,
              padding: "14px 16px",
              border: "1px solid #BBBBBB",
              borderRadius: 4,
              fontSize: 16,
              lineHeight: "1.3em",
            }}
          />
          <button
            onClick={computeL2Address}
            disabled={isComputing || !channelIdInput || !isValidBytes32(channelIdInput)}
            className="flex items-center justify-center font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              width: 120,
              height: 40,
              padding: "16px 24px",
              borderRadius: 4,
              border: "1px solid #111111",
              backgroundColor: "#2A72E5",
              fontSize: 16,
              lineHeight: "1.3em",
            }}
          >
            {isComputing ? "..." : "Calculate"}
          </button>
        </div>

        {/* L2 Address Result */}
        {l2Address && (
          <div
            className="relative"
            style={{
              padding: "14px 16px",
              paddingRight: 48,
              backgroundColor: "#F2F2F2",
              borderRadius: 4,
            }}
          >
            <span
              className="text-[#111111] break-all"
              style={{
                fontSize: 16,
                lineHeight: "1.3em",
              }}
            >
              {l2Address}
            </span>
            <button
              onClick={handleCopyL2Address}
              className="absolute top-3 right-3 hover:opacity-70 transition-opacity"
              title={copiedL2Address ? "Copied!" : "Copy L2 address"}
            >
              <Copy
                className={`w-6 h-6 ${copiedL2Address ? "text-green-600" : "text-[#111111]"}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Transaction History - Only show when channel ID is set */}
      {currentChannelId && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span
              className="font-medium text-[#111111]"
              style={{ fontSize: 20, lineHeight: "1.3em" }}
            >
              Transaction History
            </span>
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTxFilterOpen(!isTxFilterOpen)}
                className="flex items-center justify-between"
                style={{
                  width: 90,
                  height: 32,
                  padding: "7px 8px",
                  border: "1px solid #111111",
                  borderRadius: 4,
                }}
              >
                <span
                  className="font-medium text-[#111111]"
                  style={{ fontSize: 14, lineHeight: "1.3em" }}
                >
                  {filterLabels[txFilterType]}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-[#111111] transition-transform ${isTxFilterOpen ? "rotate-180" : ""}`} 
                />
              </button>
              {/* Dropdown Menu */}
              {isTxFilterOpen && (
                <div
                  className="absolute right-0 mt-1 bg-white shadow-lg z-10"
                  style={{
                    width: 90,
                    border: "1px solid #DDDDDD",
                    borderRadius: 4,
                  }}
                >
                  {(["all", "from", "to"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTxFilterType(type);
                        setIsTxFilterOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 hover:bg-gray-100 ${
                        txFilterType === type ? "bg-gray-50 font-medium" : ""
                      }`}
                      style={{ fontSize: 14 }}
                    >
                      {filterLabels[type]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex flex-col gap-2">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#999999]" />
                <span className="ml-2 text-[#999999]" style={{ fontSize: 14 }}>
                  Loading...
                </span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-4">
                <span className="text-[#999999]" style={{ fontSize: 14 }}>
                  {transactionHistory.length === 0 
                    ? "No transactions yet" 
                    : `No ${txFilterType === "from" ? "sent" : txFilterType === "to" ? "received" : ""} transactions`}
                </span>
              </div>
            ) : (
              filteredTransactions.map((tx, index) => (
                <div
                  key={`${tx.sequenceNumber}-${index}`}
                  className="flex flex-col gap-1.5"
                  style={{
                    padding: "10px 16px",
                    border: "1px solid #DDDDDD",
                    borderRadius: 4,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={tx.type === "received" ? "text-[#3EB100]" : "text-[#E53935]"}
                      style={{ fontSize: 12, lineHeight: "1.48em", fontWeight: 500 }}
                    >
                      {tx.type === "received" ? "Received" : "Sent"}
                    </span>
                    <span
                      className="text-[#666666]"
                      style={{ fontSize: 12, lineHeight: "1.48em" }}
                    >
                      {tx.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={TONSymbol}
                      alt={tx.token}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span
                      className={tx.type === "received" ? "text-[#3EB100]" : "text-[#E53935]"}
                      style={{ fontSize: 14, lineHeight: "1.48em", fontWeight: 500 }}
                    >
                      {tx.type === "received" ? "+" : "-"}{tx.amountFormatted} {tx.token}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
