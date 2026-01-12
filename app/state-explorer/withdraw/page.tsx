/**
 * Withdraw Page
 *
 * Page for withdrawing tokens from closed channel
 * Shows when channel is closed
 */

"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";

export default function WithdrawPage() {
  const { currentChannelId } = useChannelFlowStore();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasWithdrawn, setHasWithdrawn] = useState(false);

  // TODO: Get from contract
  const withdrawableAmount = "10.5";
  const tokenSymbol = "TON";

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // TODO: Implement withdraw transaction
    console.log("Withdraw from channel:", currentChannelId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsWithdrawing(false);
    setHasWithdrawn(true);
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-6 pt-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Withdraw Tokens</h3>
          <p className="text-gray-600 text-sm">
            Channel is closed. You can now withdraw your tokens.
          </p>
        </div>

        {/* Withdrawable Amount */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Available to Withdraw</p>
          <p className="text-3xl font-bold text-gray-900">
            {withdrawableAmount} {tokenSymbol}
          </p>
        </div>

        {/* Status Messages */}
        {hasWithdrawn && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
            ✓ Tokens have been withdrawn successfully
          </div>
        )}

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || hasWithdrawn}
          className="w-full"
        >
          {isWithdrawing
            ? "Withdrawing..."
            : hasWithdrawn
            ? "Already Withdrawn"
            : "Withdraw"}
        </Button>
      </CardContent>
    </Card>
  );
}
