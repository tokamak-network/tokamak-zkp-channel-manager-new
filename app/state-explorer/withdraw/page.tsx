/**
 * Withdraw Component
 *
 * Component for withdrawing tokens from closed channel
 * Shows when channel is closed
 *
 * Design:
 * - https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3148-243134
 */

"use client";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useWithdraw } from "./_hooks";
import { formatUnits } from "viem";

export function WithdrawPage() {
  const { currentChannelId } = useChannelFlowStore();
  const {
    handleWithdraw,
    isWithdrawing,
    withdrawSuccess,
    error,
    withdrawableAmount,
  } = useWithdraw({ channelId: currentChannelId });

  // Format withdrawable amount (assuming 18 decimals for ERC20 tokens)
  const formattedAmount = formatUnits(withdrawableAmount, 18);

  // Mock token balances - TODO: Replace with actual multi-token balance fetching
  const tokenBalances = [
    { symbol: "TON", amount: formattedAmount, color: "#007AFF" },
    { symbol: "USDC", amount: "2.00", color: "#2775CA" },
    { symbol: "USDT", amount: "153.00", color: "#50AF95" },
  ];

  return (
    <div className="font-mono" style={{ width: 544 }}>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-medium text-[#111111]"
          style={{ fontSize: 32, lineHeight: "1.3em" }}
        >
          Withdraw
        </h2>

        {/* Amount Section */}
        <div className="flex flex-col gap-3">
          <span
            className="font-medium text-[#111111]"
            style={{ fontSize: 18, lineHeight: "1.3em" }}
          >
            Amount
          </span>

          {/* Token Balance Cards */}
          <div className="flex flex-col gap-3">
            {tokenBalances.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between"
                style={{
                  padding: "16px 24px",
                  borderRadius: 4,
                  border: "1px solid #5F5F5F",
                }}
              >
                {/* Amount */}
                <span
                  className="font-medium"
                  style={{
                    fontSize: 24,
                    lineHeight: "1.3em",
                    color: "#2A72E5",
                  }}
                >
                  {token.amount}
                </span>

                {/* Token Pill */}
                <div
                  className="flex items-center gap-2"
                  style={{
                    height: 40,
                    padding: "8px 12px",
                    backgroundColor: "#DDDDDD",
                    borderRadius: "46px 40px 40px 46px",
                    border: "1px solid #9A9A9A",
                  }}
                >
                  {/* Token Icon */}
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: token.color,
                    }}
                  >
                    <span className="text-white text-xs font-bold">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  {/* Token Symbol */}
                  <span
                    className="text-[#111111]"
                    style={{ fontSize: 18, lineHeight: "1.3em" }}
                  >
                    {token.symbol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || withdrawSuccess}
          className="flex items-center justify-center font-mono font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            height: 40,
            padding: "16px 24px",
            borderRadius: 4,
            border: "1px solid #111111",
            backgroundColor: isWithdrawing ? "#BBBBBB" : "#2A72E5",
            color: "#FFFFFF",
            fontSize: 20,
            lineHeight: "1.3em",
          }}
        >
          {isWithdrawing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : withdrawSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Withdrawn
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </div>

      {/* Success Message */}
      {withdrawSuccess && (
        <div
          className="mt-6 p-4 flex items-center gap-2"
          style={{
            backgroundColor: "#E8F8E8",
            borderRadius: 4,
            border: "1px solid #22C55E",
          }}
        >
          <CheckCircle className="w-5 h-5 text-[#22C55E]" />
          <span className="text-[#22C55E]" style={{ fontSize: 14 }}>
            Tokens have been withdrawn successfully
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mt-6 p-4 flex items-start gap-2"
          style={{
            backgroundColor: "#FEE2E2",
            borderRadius: 4,
            border: "1px solid #EF4444",
          }}
        >
          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <span className="text-[#EF4444]" style={{ fontSize: 14 }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
