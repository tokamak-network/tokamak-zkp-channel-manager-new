/**
 * Deposit Component
 *
 * Component for depositing tokens to channel
 * Shows when channel is not initialized
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210864
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useDepositStore } from "@/stores/useDepositStore";
import { useApprove, useDeposit } from "./_hooks";
import { useGenerateMptKey } from "@/hooks/useGenerateMptKey";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { FIXED_TARGET_CONTRACT } from "@tokamak/config";
import { formatUnits } from "viem";
import { RefreshCw, Copy } from "lucide-react";
import { Button, AmountInput } from "@/components/ui";
import { DepositConfirmModal } from "./_components/DepositConfirmModal";

function DepositPage() {
  const { currentChannelId } = useChannelFlowStore();
  const currentUserMPTKey = useDepositStore(
    (state) => state.currentUserDeposit.mptKey
  );
  const setCurrentUserMPTKey = useDepositStore(
    (state) => state.setCurrentUserMPTKey
  );
  const depositError = useDepositStore(
    (state) => state.currentUserDeposit.error
  );

  const [depositAmount, setDepositAmount] = useState("");

  // Clear MPT Key when channel changes or component unmounts
  useEffect(() => {
    // Clear MPT Key when channel changes
    setCurrentUserMPTKey(null);

    // Clear MPT Key on unmount
    return () => {
      setCurrentUserMPTKey(null);
    };
  }, [currentChannelId, setCurrentUserMPTKey]);

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

  // Use the MPT key generation hook
  const {
    generate,
    isGenerating,
    error: mptKeyError,
  } = useGenerateMptKey({
    channelId: currentChannelId,
    slotIndex: 0,
    onMptKeyGenerated: setCurrentUserMPTKey,
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
    isApproving,
    approvalSuccess,
    handleApprove,
    approveError,
  } = useApprove({
    tokenAddress: tokenAddress as `0x${string}`,
    depositAmount,
  });

  // Use the deposit hook
  const {
    handleDeposit,
    isDepositing,
    depositTxHash,
    depositError: depositTxError,
  } = useDeposit({
    channelId: currentChannelId,
    depositAmount,
    mptKey: currentUserMPTKey,
    needsApproval,
    approvalSuccess,
    tokenDecimals,
  });

  const handleGenerateKey = async () => {
    await generate();
  };

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

  const isFormValid =
    currentUserMPTKey &&
    depositAmount &&
    !isDepositing &&
    !isInsufficientBalance &&
    (!needsApproval || approvalSuccess);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirmModal = () => {
    if (isFormValid) {
      setShowConfirmModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
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

        {/* L2 MPT Key */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <label
              className="font-medium text-[#111111]"
              style={{ fontSize: 18, lineHeight: "1.3em" }}
            >
              L2 MPT Key
            </label>
            {currentUserMPTKey ? (
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={isGenerating || !currentChannelId}
                className="p-1 hover:bg-[#F2F2F2] rounded transition-colors"
                title="Regenerate MPT Key"
              >
                <RefreshCw className="w-6 h-6 text-[#2A72E5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={isGenerating || !currentChannelId}
                className="flex items-center justify-center font-medium text-white transition-colors"
                style={{
                  width: 120,
                  height: 40,
                  borderRadius: 4,
                  border: "1px solid #111111",
                  backgroundColor: isGenerating ? "#999999" : "#2A72E5",
                  fontSize: 18,
                  cursor: isGenerating || !currentChannelId ? "not-allowed" : "pointer",
                }}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            )}
          </div>
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
            <span
              className={`truncate ${currentUserMPTKey ? "text-[#111111]" : "text-[#999999]"}`}
              style={{ maxWidth: currentUserMPTKey ? "calc(100% - 32px)" : "100%" }}
            >
              {currentUserMPTKey
                ? `${currentUserMPTKey.slice(0, 42)}...`
                : "Click Generate to create your L2 MPT Key"}
            </span>
            {currentUserMPTKey && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(currentUserMPTKey)}
                className="flex-shrink-0 p-1 hover:bg-[#E5E5E5] rounded transition-colors"
                title="Copy MPT Key"
              >
                <Copy className="w-6 h-6 text-[#666666]" />
              </button>
            )}
          </div>
        </div>

        {/* Amount */}
        <AmountInput
          value={depositAmount}
          onChange={setDepositAmount}
          balance={formattedBalance}
          tokenSymbol={tokenSymbol}
          onMaxClick={handleMaxClick}
          error={isInsufficientBalance}
        />

        {/* Approve Button */}
        {needsApproval && !approvalSuccess && (
          <Button
            variant="primary"
            size="full"
            onClick={handleApprove}
            disabled={!depositAmount || isApproving}
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        )}

        {/* Confirm Button */}
        {(!needsApproval || approvalSuccess) && (
          <Button
            variant="primary"
            size="full"
            onClick={handleOpenConfirmModal}
            disabled={!isFormValid}
          >
            Confirm
          </Button>
        )}
      </div>

      {/* Deposit Confirm Modal */}
      {showConfirmModal && currentChannelId && (
        <DepositConfirmModal
          channelId={currentChannelId}
          depositAmount={depositAmount}
          tokenSymbol={tokenSymbol}
          onDeposit={handleDeposit}
          isProcessing={isDepositing}
          txHash={depositTxHash ?? null}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default DepositPage;
