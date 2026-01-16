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

import Image from "next/image";
import { Loader2, CheckCircle } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useWithdraw } from "./_hooks";
import { formatUnits } from "viem";

// Token symbol images
import TONSymbol from "@/assets/symbols/TON.svg";

export function WithdrawPage() {
  const { currentChannelId } = useChannelFlowStore();
  const {
    handleWithdraw,
    isWithdrawing,
    withdrawSuccess,
    withdrawableAmount,
    channelTargetContract,
  } = useWithdraw({ channelId: currentChannelId });

  // Format withdrawable amount (assuming 18 decimals for ERC20 tokens)
  const formattedAmount = formatUnits(withdrawableAmount, 18);

  // Token info for the channel's target contract
  // Currently channels support single token (targetContract)
  const tokenInfo = channelTargetContract
    ? { symbol: "TON", amount: formattedAmount }
    : null;

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

          {/* Token Balance Card */}
          {tokenInfo && (
            <div
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
                {tokenInfo.amount}
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
                <Image
                  src={TONSymbol}
                  alt={tokenInfo.symbol}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {/* Token Symbol */}
                <span
                  className="text-[#111111]"
                  style={{ fontSize: 18, lineHeight: "1.3em" }}
                >
                  {tokenInfo.symbol}
                </span>
              </div>
            </div>
          )}
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

    </div>
  );
}
