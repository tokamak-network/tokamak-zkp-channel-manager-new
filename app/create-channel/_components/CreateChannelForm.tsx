/**
 * Create Channel Form
 *
 * Form for creating a channel transaction
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-6164
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useChannelFormStore } from "@/stores";
import { TransactionConfirmModal } from "./TransactionConfirmModal";
import { useCreateChannel } from "../_hooks/useCreateChannel";
import { useChannelId } from "../_hooks/useChannelId";
import { usePreAllocatedLeavesCount } from "../_hooks/usePreAllocatedLeavesCount";
import { useChannelIdExists } from "../_hooks/useChannelIdExists";
import { calculateMaxParticipants } from "../_utils";
import { getL1NetworkName, SUPPORTED_TOKENS, type TokenSymbol } from "@tokamak/config";
import { Info, Check, Copy, ChevronDown, AlertTriangle, Circle, CheckCircle2 } from "lucide-react";
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

  // Selected tokens state (supports multiple tokens in future)
  const [selectedTokens, setSelectedTokens] = useState<TokenSymbol[]>(["TON"]);

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

  // Check if the generated channel ID already exists
  const { exists: channelIdExists, isLoading: isCheckingChannelId } =
    useChannelIdExists(generatedChannelId as `0x${string}` | null);

  // Get token addresses for selected tokens
  const selectedTokenAddresses = useMemo(
    () => selectedTokens.map((symbol) => SUPPORTED_TOKENS[symbol].address),
    [selectedTokens]
  );

  // Fetch pre-allocated leaves count from contract (cached)
  const { totalPreAllocatedCount, isLoading: isLoadingPreAllocated } =
    usePreAllocatedLeavesCount(selectedTokenAddresses);

  // Calculate max participants dynamically: N = (L - P) / S
  // L = 16 (Merkle tree leaves), P = totalPreAllocatedCount, S = selectedTokens.length
  const maxParticipants = calculateMaxParticipants(
    totalPreAllocatedCount,
    selectedTokens.length
  );

  // Toggle token selection (for future multi-token support)
  const toggleToken = (symbol: TokenSymbol) => {
    if (!SUPPORTED_TOKENS[symbol].enabled) return;

    setSelectedTokens((prev) => {
      if (prev.includes(symbol)) {
        // Don't allow deselecting if it's the only token
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== symbol);
      }
      return [...prev, symbol];
    });
  };

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
    !channelIdExists && // Channel ID must not already exist
    !isCheckingChannelId &&
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
                selected={selectedTokens.includes("TON")}
                onClick={() => toggleToken("TON")}
                disabled={!SUPPORTED_TOKENS.TON.enabled}
                icon={<Image src={TONSymbol} alt="TON" width={24} height={24} />}
              >
                TON
              </TokenButton>
              <TokenButton
                selected={selectedTokens.includes("USDT")}
                onClick={() => toggleToken("USDT")}
                disabled={!SUPPORTED_TOKENS.USDT.enabled}
                icon={<Image src={USDTSymbol} alt="USDT" width={24} height={24} />}
              >
                USDT
              </TokenButton>
              <TokenButton
                selected={selectedTokens.includes("USDC")}
                onClick={() => toggleToken("USDC")}
                disabled={!SUPPORTED_TOKENS.USDC.enabled}
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
          {/* Warning: Channel ID already exists */}
          {generatedChannelId && channelIdExists && (
            <div className="flex items-center gap-2 p-3 bg-[#FFF3CD] border border-[#FFE69C] rounded">
              <AlertTriangle className="w-5 h-5 text-[#856404] flex-shrink-0" />
              <p className="text-sm text-[#856404]">
                This Channel ID already exists. Please change the salt to generate a new one.
              </p>
            </div>
          )}
          {/* Loading: Checking channel ID */}
          {generatedChannelId && isCheckingChannelId && (
            <p className="text-sm text-[#666666]">Checking channel ID availability...</p>
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
          <Label hint={isLoadingPreAllocated ? "Loading..." : `Max ${maxParticipants}`}>
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

        {/* Validation Checklist */}
        {!isFormValid && (
          <div className="space-y-2 p-4 bg-[#F8F9FA] rounded border border-[#E5E5E5]">
            <p className="text-sm font-medium text-[#666666] mb-3">Requirements:</p>
            
            {/* App Selection */}
            <div className="flex items-center gap-2">
              {selectedApp ? (
                <CheckCircle2 className="w-4 h-4 text-[#3EB100]" />
              ) : (
                <Circle className="w-4 h-4 text-[#999999]" />
              )}
              <span className={`text-sm ${selectedApp ? "text-[#3EB100]" : "text-[#666666]"}`}>
                Select an app type
              </span>
            </div>

            {/* Channel ID Generation */}
            <div className="flex items-center gap-2">
              {generatedChannelId && !channelIdExists ? (
                <CheckCircle2 className="w-4 h-4 text-[#3EB100]" />
              ) : generatedChannelId && channelIdExists ? (
                <AlertTriangle className="w-4 h-4 text-[#DC3545]" />
              ) : (
                <Circle className="w-4 h-4 text-[#999999]" />
              )}
              <span className={`text-sm ${
                generatedChannelId && !channelIdExists 
                  ? "text-[#3EB100]" 
                  : generatedChannelId && channelIdExists
                    ? "text-[#DC3545]"
                    : "text-[#666666]"
              }`}>
                {generatedChannelId && channelIdExists 
                  ? "Channel ID already exists - change salt"
                  : "Generate a Channel ID"}
              </span>
            </div>

            {/* Participant Address */}
            <div className="flex items-center gap-2">
              {validAddressCount >= 1 ? (
                <CheckCircle2 className="w-4 h-4 text-[#3EB100]" />
              ) : (
                <Circle className="w-4 h-4 text-[#999999]" />
              )}
              <span className={`text-sm ${validAddressCount >= 1 ? "text-[#3EB100]" : "text-[#666666]"}`}>
                Add at least one participant address
              </span>
            </div>

            {/* Wallet Connection */}
            {!isConnected && (
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-[#999999]" />
                <span className="text-sm text-[#666666]">
                  Connect your wallet
                </span>
              </div>
            )}
          </div>
        )}

        {/* Create Channel Button */}
        <Button size="full" onClick={handleOpenConfirmModal} disabled={!isFormValid}>
          Create Channel
        </Button>
      </div>
    </>
  );
}
