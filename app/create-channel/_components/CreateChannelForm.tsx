/**
 * Create Channel Form
 *
 * Form for creating a channel transaction
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useChannelFormStore } from "@/stores";
import { TransactionConfirmModal } from "./TransactionConfirmModal";
import { useCreateChannel } from "../_hooks/useCreateChannel";
import { useChannelId } from "../_hooks/useChannelId";
import { CHANNEL_PARTICIPANTS } from "@tokamak/config";
import { Info, Check, Copy, RefreshCw } from "lucide-react";
import { Button, Input, TokenButton, Label } from "@/components/ui";

export function CreateChannelForm() {
  const { isConnected } = useAccount();

  const { participants, updateParticipant, setParticipants, isValid } =
    useChannelFormStore();

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Use channel ID generation hook
  const {
    salt,
    setSalt,
    generatedChannelId,
    leaderAddress,
    generateChannelId,
  } = useChannelId({ participants });

  const [channelIdError, setChannelIdError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Copy channel ID to clipboard
  const handleCopyChannelId = async () => {
    if (!generatedChannelId) return;
    try {
      await navigator.clipboard.writeText(generatedChannelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Truncate channel ID for display
  const truncateChannelId = (id: string) => {
    if (id.length <= 45) return id;
    return `${id.slice(0, 42)}...`;
  };

  // Use create channel hook
  const {
    createChannel,
    isCreating,
    isConfirming,
    error: createError,
    createdChannelId,
    txHash,
    reset,
  } = useCreateChannel({
    participants,
    isValid,
    isConnected,
    channelId: generatedChannelId,
  });

  // Initialize participants on mount - always start with one empty field
  useEffect(() => {
    const store = useChannelFormStore.getState();
    store.setParticipants([{ address: "" as `0x${string}` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show modal when channel is created
  useEffect(() => {
    if (createdChannelId) {
      setShowConfirmModal(true);
    }
  }, [createdChannelId]);

  const handleGenerateChannelId = () => {
    try {
      setChannelIdError(null);
      generateChannelId();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate channel ID";
      setChannelIdError(errorMessage);
    }
  };

  const handleCreateChannel = async () => {
    await createChannel();
  };

  // Helper function to check if an address is a valid Ethereum EOA
  const isValidEOA = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Track which addresses are valid
  const addressValidation = participants.map((p) => ({
    address: p.address,
    isValid: p.address && p.address.length > 0 ? isValidEOA(p.address) : false,
    isEmpty: !p.address || p.address.length === 0,
  }));

  // Count valid addresses (non-empty and valid)
  const validAddressCount = addressValidation.filter(
    (v) => !v.isEmpty && v.isValid
  ).length;

  // Determine if we should show a new empty field
  const shouldShowNewField =
    validAddressCount === participants.length &&
    validAddressCount < CHANNEL_PARTICIPANTS.MAX;

  // Auto-add new field when last field is filled with valid address
  useEffect(() => {
    if (shouldShowNewField) {
      setParticipants([...participants, { address: "" as `0x${string}` }]);
    }
  }, [shouldShowNewField, participants, setParticipants]);

  const isFormValid =
    generatedChannelId &&
    validAddressCount >= CHANNEL_PARTICIPANTS.MIN &&
    validAddressCount <= CHANNEL_PARTICIPANTS.MAX &&
    !isCreating &&
    !isConfirming &&
    isConnected;

  return (
    <>
      {/* Transaction Confirm Modal */}
      {showConfirmModal && createdChannelId && txHash && (
        <TransactionConfirmModal
          channelId={createdChannelId}
          txHash={txHash}
          onClose={() => {
            setShowConfirmModal(false);
            reset();
          }}
        />
      )}

      <div className="w-[544px] space-y-6 font-mono">
        {/* Target Token Selection */}
        <div className="space-y-3">
          <Label>Target</Label>
          <div className="flex gap-4">
            <TokenButton
              selected
              icon={<span className="text-[#2A72E5] font-bold text-xs">T</span>}
            >
              TON
            </TokenButton>
            <TokenButton
              disabled
              icon={<span className="text-[#999999] font-bold text-xs">T</span>}
            >
              USDT
            </TokenButton>
            <TokenButton
              disabled
              icon={<span className="text-[#999999] font-bold text-xs">U</span>}
            >
              USDC
            </TokenButton>
          </div>
        </div>

        {/* Channel ID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between w-full">
            <Label>Channel ID</Label>
            {generatedChannelId ? (
              <button
                type="button"
                className="p-1 hover:bg-[#F2F2F2] rounded transition-colors"
                title="Regenerate Channel ID"
                // TODO: Implement regenerate functionality
              >
                <RefreshCw className="w-6 h-6 text-[#2A72E5]" />
              </button>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerateChannelId}
                disabled={!leaderAddress}
              >
                Generate
              </Button>
            )}
          </div>
          {generatedChannelId ? (
            <div className="w-full py-3.5 px-4 bg-[#F2F2F2] rounded flex items-center justify-between gap-2">
              <span className="text-lg font-mono text-[#111111] truncate">
                {truncateChannelId(generatedChannelId)}
              </span>
              <button
                type="button"
                onClick={handleCopyChannelId}
                className="flex-shrink-0 p-1 hover:bg-[#E5E5E5] rounded transition-colors"
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                <Copy className={`w-6 h-6 ${copied ? "text-[#3EB100]" : "text-[#666666]"}`} />
              </button>
            </div>
          ) : (
            <Input
              value=""
              placeholder="Generate your Channel ID"
              readOnly
            />
          )}
          {channelIdError && (
            <p className="text-sm text-red-500">{channelIdError}</p>
          )}
        </div>

        {/* Salt (Optional) */}
        <div className="space-y-4">
          <Label hint="Optional" hintIcon={<Info className="w-4 h-4 text-[#666666]" />}>
            Salt
          </Label>
          <Input
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="Enter custom salt"
            disabled={!!generatedChannelId}
          />
        </div>

        {/* Number of Participants */}
        <div className="space-y-4">
          <Label hint={`Min ${CHANNEL_PARTICIPANTS.MIN}, Max ${CHANNEL_PARTICIPANTS.MAX}`}>
            Number of Participants
          </Label>
          <div className="w-full h-12 px-4 py-2 bg-[#F2F2F2] rounded flex items-center">
            <span className="text-[32px] font-medium text-[#2A72E5]">
              {validAddressCount}
            </span>
          </div>
        </div>

        {/* Participants Address */}
        <div className="space-y-4">
          <Label>Participants Address</Label>
          <div className="space-y-2">
            {participants.map((participant, index) => {
              const validation = addressValidation[index];
              const showError = !validation.isEmpty && !validation.isValid;
              const showSuccess = !validation.isEmpty && validation.isValid;

              return (
                <div key={index}>
                  <Input
                    value={participant.address}
                    onChange={(e) =>
                      updateParticipant(index, e.target.value as `0x${string}`)
                    }
                    placeholder="Enter Ethereum address"
                    error={showError}
                    success={showSuccess}
                    rightIcon={
                      showSuccess ? (
                        <Check className="w-6 h-6 text-[#3EB100]" />
                      ) : undefined
                    }
                  />
                  {showError && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid Ethereum address
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Messages */}
        {createError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-mono">
            {createError}
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm font-mono">
            Transaction: {txHash}
            {isConfirming && " (Confirming...)"}
          </div>
        )}

        {!isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm font-mono">
            Please connect your wallet to create a channel
          </div>
        )}

        {/* Create Channel Button */}
        <Button size="full" onClick={handleCreateChannel} disabled={!isFormValid}>
          {isCreating || isConfirming ? "Creating Channel..." : "Create Channel"}
        </Button>
      </div>
    </>
  );
}
