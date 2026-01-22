/**
 * Withdraw Component
 *
 * Component for withdrawing tokens from closed channel
 * Shows when channel is closed
 */

"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useWithdraw } from "./_hooks";
import { WithdrawConfirmModal } from "./_components";
import { formatUnits } from "viem";

function WithdrawPage() {
  const { currentChannelId } = useChannelFlowStore();
  const {
    handleWithdraw,
    isWithdrawing,
    withdrawTxHash,
    withdrawSuccess,
    error,
    withdrawableAmount,
    currentStep,
    reset,
  } = useWithdraw({ channelId: currentChannelId });

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Format withdrawable amount (assuming 18 decimals for ERC20 tokens)
  const formattedAmount = formatUnits(withdrawableAmount, 18);
  const tokenSymbol = "TON";

  const handleOpenModal = () => {
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    reset();
  };

  return (
    <>
      {/* Withdraw Confirm Modal */}
      {showConfirmModal && currentChannelId && (
        <WithdrawConfirmModal
          channelId={currentChannelId}
          amount={formattedAmount}
          tokenSymbol={tokenSymbol}
          onWithdraw={handleWithdraw}
          isProcessing={isWithdrawing}
          txHash={withdrawTxHash ?? null}
          currentStep={currentStep}
          onClose={handleCloseModal}
        />
      )}

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
              {formattedAmount} {tokenSymbol}
            </p>
          </div>

          {/* Status Messages */}
          {withdrawSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              ✓ Tokens have been withdrawn successfully
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Withdraw Button */}
          <Button
            onClick={handleOpenModal}
            disabled={isWithdrawing || withdrawSuccess}
            className="w-full"
          >
            {withdrawSuccess ? "Already Withdrawn" : "Withdraw"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

export default WithdrawPage;
