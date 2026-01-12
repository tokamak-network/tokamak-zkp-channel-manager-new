/**
 * Deposit Page
 *
 * Page for depositing tokens to channel
 * Shows when channel is not initialized
 */

"use client";

import { useState, useEffect } from "react";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useDepositStore } from "@/stores/useDepositStore";
import { useGenerateMptKey } from "@/hooks/useGenerateMptKey";
import { useApprove, useDeposit } from "./_hooks";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";

export default function DepositPage() {
  const { currentChannelId, setChannelId } = useChannelFlowStore();
  const currentUserMPTKey = useDepositStore((state) => state.currentUserDeposit.mptKey);
  const depositError = useDepositStore((state) => state.currentUserDeposit.error);
  
  const [depositAmount, setDepositAmount] = useState("");
  
  // Use the MPT key generation hook
  const { generateMPTKey, isGenerating, error: mptKeyError } = useGenerateMptKey();

  // Use the approval hook
  const {
    needsApproval,
    isInsufficientBalance,
    balance,
    isApproving,
    approvalSuccess,
    handleApprove,
    approveError,
  } = useApprove({
    tokenAddress: FIXED_TARGET_CONTRACT,
    depositAmount,
  });

  // Use the deposit hook
  const {
    handleDeposit,
    isDepositing,
    depositTxHash,
    depositError: depositTxError,
  } = useDeposit({
    depositAmount,
    mptKey: currentUserMPTKey,
    needsApproval,
    approvalSuccess,
  });

  // Set channel ID in store when component mounts
  useEffect(() => {
    if (currentChannelId) {
      setChannelId(BigInt(currentChannelId));
    }
  }, [currentChannelId, setChannelId]);

  const handleGenerateKey = async () => {
    const mptKey = await generateMPTKey();
    if (mptKey) {
      console.log("✅ MPT Key generated successfully:", mptKey);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-6 pt-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Deposit Tokens</h3>
          <p className="text-gray-600 text-sm">
            Generate your L2 MPT Key and deposit tokens to the channel
          </p>
        </div>

        {/* L2 MPT Key */}
        <div>
          <Label>L2 MPT Key</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={currentUserMPTKey || ""}
              placeholder="Generate your L2 MPT Key"
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleGenerateKey}
              disabled={isGenerating || !!currentUserMPTKey}
              variant="outline"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
          {mptKeyError && (
            <p className="text-sm text-red-500 mt-1">{mptKeyError}</p>
          )}
          {!mptKeyError && (
            <p className="text-sm text-gray-500 mt-1">
              Generate a unique key for this channel
            </p>
          )}
        </div>

        {/* Deposit Amount */}
        <div>
          <Label required>Deposit Amount</Label>
          <Input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Enter amount to deposit"
            className={`mt-2 ${
              isInsufficientBalance
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
          />
          {balance && (
            <p className="text-sm text-gray-500 mt-1">
              Balance: {(Number(balance) / 1e18).toFixed(4)} TON
            </p>
          )}
          {isInsufficientBalance && (
            <p className="text-sm text-red-500 mt-1">
              Insufficient balance. You cannot deposit more than your current balance.
            </p>
          )}
          {!isInsufficientBalance && !balance && (
            <p className="text-sm text-gray-500 mt-1">
              Enter the amount of TON to deposit
            </p>
          )}
        </div>

        {/* Approve Error */}
        {approveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {approveError.message || "Failed to approve tokens"}
          </div>
        )}

        {/* Deposit Error */}
        {(depositError || depositTxError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {depositError || depositTxError?.message || "Failed to deposit tokens"}
          </div>
        )}

        {/* Success Messages */}
        {approvalSuccess && !depositTxHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Tokens approved successfully
          </div>
        )}
        {depositTxHash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            <p className="font-semibold mb-1">Transaction Submitted</p>
            <p className="text-xs font-mono break-all">{depositTxHash}</p>
            {isDepositing && <p className="text-xs mt-1">Waiting for confirmation...</p>}
          </div>
        )}

        {/* Approve Button - Shows when approval is needed */}
        {needsApproval && !approvalSuccess && (
          <Button
            onClick={handleApprove}
            disabled={!depositAmount || isApproving || isInsufficientBalance}
            className="w-full"
            variant="outline"
          >
            {isApproving ? "Approving..." : "Approve Tokens"}
          </Button>
        )}

        {/* Deposit Button - Shows when no approval needed or approval successful */}
        {(!needsApproval || approvalSuccess) && (
          <Button
            onClick={handleDeposit}
            disabled={
              !currentUserMPTKey ||
              !depositAmount ||
              isDepositing ||
              isInsufficientBalance
            }
            className="w-full"
          >
            {isDepositing ? "Depositing..." : "Deposit"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
