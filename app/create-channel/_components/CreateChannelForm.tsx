/**
 * Create Channel Form
 *
 * Form for creating a channel transaction
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useChannelFormStore } from "@/stores";
import { TransactionConfirmModal } from "./TransactionConfirmModal";
import { useCreateChannel } from "../_hooks/useCreateChannel";
import { useChannelId } from "../_hooks/useChannelId";
import { calculateMaxParticipants } from "../_utils";
import { getL1NetworkName } from "@tokamak/config";
import { Info, Check, Copy, ChevronDown } from "lucide-react";
import { Button, Input, TokenButton, Label } from "@/components/ui";

// Token symbol images
import TONSymbol from "@/assets/symbols/TON.svg";
import USDTSymbol from "@/assets/symbols/USDT.svg";
import USDCSymbol from "@/assets/symbols/USDC.svg";

// App types for channel (extensible for future app types)
export type AppType = "ERC20" | null;

const APP_OPTIONS: { value: AppType; label: string; disabled?: boolean }[] = [
  { value: "ERC20", label: "ERC20" },
  // Future app types can be added here
  // { value: "NFT", label: "NFT", disabled: true },
  // { value: "DEX", label: "DEX", disabled: true },
];

export function CreateChannelForm() {
  const { isConnected } = useAccount();

  const { participants, updateParticipant, setParticipants, isValid } =
    useChannelFormStore();

  // App type state
  const [selectedApp, setSelectedApp] = useState<AppType>(null);
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);

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

  // Calculate max participants dynamically based on Merkle tree config
  // For multiple tokens in the future, pass the token count here
  const tokenCount = 1; // Currently single token (TON)
  const maxParticipants = calculateMaxParticipants(tokenCount);

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
    txHash,
    reset,
  } = useCreateChannel({
    participants,
    isValid,
    isConnected,
    channelId: generatedChannelId,
    appType: selectedApp,
  });

  // Initialize participants on mount - always start with one empty field
  useEffect(() => {
    const store = useChannelFormStore.getState();
    store.setParticipants([{ address: "" as `0x${string}` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Open confirm modal (don't execute transaction yet)
  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
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
    validAddressCount < maxParticipants;

  // Auto-add new field when last field is filled with valid address
  useEffect(() => {
    if (shouldShowNewField) {
      setParticipants([...participants, { address: "" as `0x${string}` }]);
    }
  }, [shouldShowNewField, participants, setParticipants]);

  const isFormValid =
    selectedApp &&
    generatedChannelId &&
    validAddressCount >= 1 && // At least one participant required
    validAddressCount <= maxParticipants &&
    !isCreating &&
    !isConfirming &&
    isConnected;

  return (
    <>
      {/* Transaction Confirm Modal */}
      {showConfirmModal && generatedChannelId && (
        <TransactionConfirmModal
          channelId={generatedChannelId}
          participantCount={validAddressCount}
          onCreateChannel={createChannel}
          isCreating={isCreating}
          isConfirming={isConfirming}
          txHash={txHash}
          onClose={() => {
            setShowConfirmModal(false);
            reset();
          }}
        />
      )}

      <div className="w-[544px] space-y-6 font-mono">
        {/* App Selection */}
        <div className="space-y-3">
          <Label>App</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
              className="w-full h-12 px-4 bg-[#F2F2F2] rounded flex items-center justify-between text-lg transition-colors hover:bg-[#E5E5E5]"
            >
              <span className={selectedApp ? "text-[#111111]" : "text-[#999999]"}>
                {selectedApp || "Select App"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-[#666666] transition-transform ${
                  isAppDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isAppDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded shadow-lg z-10">
                {APP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      setSelectedApp(option.value);
                      setIsAppDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-lg transition-colors ${
                      option.disabled
                        ? "text-[#999999] cursor-not-allowed"
                        : "text-[#111111] hover:bg-[#F2F2F2]"
                    } ${selectedApp === option.value ? "bg-[#F2F2F2]" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Target Token Selection - Only shown when ERC20 is selected */}
        {selectedApp === "ERC20" && (
          <div className="space-y-3">
            <Label>Target</Label>
            <div className="flex gap-4">
              <TokenButton
                selected
                icon={<Image src={TONSymbol} alt="TON" width={24} height={24} />}
              >
                TON
              </TokenButton>
              <TokenButton
                disabled
                icon={<Image src={USDTSymbol} alt="USDT" width={24} height={24} />}
              >
                USDT
              </TokenButton>
              <TokenButton
                disabled
                icon={<Image src={USDCSymbol} alt="USDC" width={24} height={24} />}
              >
                USDC
              </TokenButton>
            </div>
          </div>
        )}

        {/* Channel ID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between w-full">
            <Label>Channel ID</Label>
            {!generatedChannelId && (
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

        {/* Salt */}
        <div className="space-y-4">
          <Label
            hintIcon={<Info className="w-4 h-4 text-[#666666]" />}
            tooltip="You can recover your Channel ID later using this salt word and your wallet address."
          >
            Salt
          </Label>
          <Input
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="Enter custom salt"
          />
        </div>

        {/* Number of Participants */}
        <div className="space-y-4">
          <Label hint={`Max ${maxParticipants}`}>
            Number of Participants
          </Label>
          <div className="w-full h-12 px-4 py-2 bg-[#F2F2F2] rounded flex items-center">
            <span className="text-[32px] font-medium text-[#2A72E5]">
              {validAddressCount}
            </span>
          </div>
        </div>

        {/* Participants Address (Whitelist) */}
        <div className="space-y-4">
          <Label>
            Whitelist of {getL1NetworkName()} addresses
            <br />
            for channel participation
          </Label>
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

        {/* Create Channel Button */}
        <Button size="full" onClick={handleOpenConfirmModal} disabled={!isFormValid}>
          Create Channel
        </Button>
      </div>
    </>
  );
}
