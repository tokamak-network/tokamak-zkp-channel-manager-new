/**
 * Deposit Component
 *
 * Component for depositing tokens to channel
 * Shows when channel is not initialized
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210864
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useApprove, useIntegratedDeposit, type DepositStep } from "./_hooks";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import { formatUnits } from "viem";
import { Copy, Info, CheckCircle2, Loader2 } from "lucide-react";
import { Button, AmountInput } from "@/components/ui";
import { DepositConfirmModal } from "./_components/DepositConfirmModal";

function DepositPage() {
  const { currentChannelId } = useChannelFlowStore();
  const [depositAmount, setDepositAmount] = useState("");

  // Get channel info to get target token address and decimals
  const channelInfo = useChannelInfo(
    currentChannelId ? (currentChannelId as `0x${string}`) : null
  );
  const tokenAddress = channelInfo?.targetContract || FIXED_TARGET_CONTRACT;
  const tokenDecimals = 18; // TODO: Get from token contract
  const tokenSymbol = "TON"; // TODO: Get from token contract

  // Fetch user's token balance
  const { balance: userTokenBalance } = useTokenBalance({
    tokenAddress: tokenAddress || "0x",
  });

  // Determine if deposit amount exceeds user's balance
  const isInsufficientBalance = useMemo(() => {
    if (!depositAmount || !userTokenBalance) return false;
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) return false;
      const amountWei = BigInt(Math.floor(amount * 10 ** tokenDecimals));
      return amountWei > userTokenBalance;
    } catch {
      return false;
    }
  }, [depositAmount, userTokenBalance, tokenDecimals]);

  // Use the approval hook
  const {
    needsApproval,
    approvalSuccess,
    handleApprove,
    refetchAllowance,
    refetchBalance,
  } = useApprove({
    tokenAddress: tokenAddress as `0x${string}`,
    depositAmount,
  });

  // Refetch allowance when deposit amount changes
  useEffect(() => {
    if (depositAmount) {
      refetchAllowance();
    }
  }, [depositAmount, refetchAllowance]);

  // Memoized callback for deposit success
  const handleDepositSuccess = useCallback(() => {
    // Refetch allowance and balance after successful deposit
    refetchAllowance();
    refetchBalance();
  }, [refetchAllowance, refetchBalance]);

  // Use the integrated deposit hook (MPT key generation + deposit in one flow)
  const {
    startDeposit,
    currentStep,
    mptKey,
    isProcessing,
    error: depositError,
    txHash: depositTxHash,
    reset: resetDeposit,
  } = useIntegratedDeposit({
    channelId: currentChannelId,
    depositAmount,
    tokenDecimals,
    needsApproval,
    approvalSuccess,
    handleApprove,
    onDepositSuccess: handleDepositSuccess,
  });

  const handleMaxClick = () => {
    if (userTokenBalance !== undefined) {
      setDepositAmount(formatUnits(userTokenBalance, tokenDecimals));
    }
  };

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (userTokenBalance === undefined) return "0";
    return formatUnits(userTokenBalance, tokenDecimals);
  }, [userTokenBalance, tokenDecimals]);

  // Form is valid when deposit amount is entered and no balance issues
  const isFormValid =
    depositAmount &&
    parseFloat(depositAmount) >= 0 &&
    !isInsufficientBalance &&
    !isProcessing;

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirmModal = () => {
    if (isFormValid) {
      setShowConfirmModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    if (currentStep === "completed" || currentStep === "error") {
      resetDeposit();
    }
  };

  // Get step description for progress display
  const getStepDescription = (step: DepositStep): string => {
    switch (step) {
      case "signing_mpt":
        return "Signing to generate your L2 MPT Key...";
      case "mpt_generated":
        return "MPT Key generated!";
      case "approving":
        return "Approving token transfer...";
      case "signing_deposit":
        return "Signing deposit transaction...";
      case "confirming":
        return "Confirming transaction on blockchain...";
      case "completed":
        return "Deposit completed!";
      case "error":
        return "An error occurred";
      default:
        return "";
    }
  };

  return (
    <div className="font-mono" style={{ width: 544 }}>
      {/* Deposit Section */}
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-medium text-[#111111]"
          style={{ fontSize: 32, lineHeight: "1.3em" }}
        >
          Deposit
        </h2>

        {/* Two Signatures Notice */}
        <div className="flex items-start gap-3 p-4 bg-[#E8F4FD] border border-[#B8DAFF] rounded-lg">
          <Info className="w-5 h-5 text-[#0056B3] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#004085]">
            <p className="font-medium mb-1">Two wallet signatures required</p>
            <p className="text-[#004085]/80 leading-relaxed">
              Depositing requires two signatures: first to generate your unique L2 key, 
              then to confirm the deposit transaction.
              {needsApproval && !approvalSuccess && " A third signature may be needed for token approval."}
            </p>
          </div>
        </div>

        {/* Generated MPT Key Display (only show after generation) */}
        {mptKey && (
          <div className="flex flex-col gap-3">
            <label
              className="font-medium text-[#111111]"
              style={{ fontSize: 18, lineHeight: "1.3em" }}
            >
              L2 MPT Key
            </label>
            <div
              className="w-full flex items-center justify-between"
              style={{
                backgroundColor: "#F2F2F2",
                borderRadius: 4,
                padding: "14px 16px",
                fontSize: 18,
                minHeight: 52,
              }}
            >
              <span className="text-[#111111] truncate" style={{ maxWidth: "calc(100% - 32px)" }}>
                {`${mptKey.slice(0, 42)}...`}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(mptKey)}
                className="flex-shrink-0 p-1 hover:bg-[#E5E5E5] rounded transition-colors"
                title="Copy MPT Key"
              >
                <Copy className="w-6 h-6 text-[#666666]" />
              </button>
            </div>
          </div>
        )}

        {/* Amount */}
        <AmountInput
          value={depositAmount}
          onChange={setDepositAmount}
          balance={formattedBalance}
          tokenSymbol={tokenSymbol}
          onMaxClick={handleMaxClick}
          error={isInsufficientBalance}
        />

        {/* Progress Steps (shown when processing) */}
        {isProcessing && currentStep !== "idle" && (
          <div className="flex items-center gap-3 p-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-lg">
            <Loader2 className="w-5 h-5 text-[#2A72E5] animate-spin flex-shrink-0" />
            <span className="text-sm text-[#666666]">
              {getStepDescription(currentStep)}
            </span>
          </div>
        )}

        {/* Success State */}
        {currentStep === "completed" && (
          <div className="flex items-center gap-3 p-4 bg-[#D4EDDA] border border-[#C3E6CB] rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-[#155724] flex-shrink-0" />
            <span className="text-sm text-[#155724]">
              Deposit completed successfully!
            </span>
          </div>
        )}

        {/* Error State */}
        {depositError && (
          <div className="p-4 bg-[#F8D7DA] border border-[#F5C6CB] rounded-lg">
            <p className="text-sm text-[#721C24]">{depositError}</p>
          </div>
        )}

        {/* Deposit Button */}
        <Button
          variant="primary"
          size="full"
          onClick={handleOpenConfirmModal}
          disabled={!isFormValid}
        >
          {!depositAmount
            ? "Enter Amount"
            : isInsufficientBalance
              ? "Insufficient Balance"
              : "Deposit"}
        </Button>
      </div>

      {/* Deposit Confirm Modal */}
      {showConfirmModal && currentChannelId && (
        <DepositConfirmModal
          channelId={currentChannelId}
          depositAmount={depositAmount}
          tokenSymbol={tokenSymbol}
          onDeposit={startDeposit}
          isProcessing={isProcessing}
          txHash={depositTxHash ?? null}
          onClose={handleCloseModal}
          currentStep={currentStep}
        />
      )}
    </div>
  );
}

export default DepositPage;
