/**
 * Create Channel Form
 *
 * Form for creating a channel transaction
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useChannelFormStore } from "@/stores";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";
import { TransactionConfirmModal } from "./TransactionConfirmModal";
import { useCreateChannel } from "../_hooks/useCreateChannel";
import { useChannelId } from "../_hooks/useChannelId";
import { CHANNEL_PARTICIPANTS } from "@tokamak/config";

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
    resetChannelId,
  } = useChannelId({ participants });

  const [channelIdError, setChannelIdError] = useState<string | null>(null);

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
    // Always initialize with exactly one empty participant
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

      <Card className="max-w-4xl">
        <CardContent className="space-y-6">
          {/* Target Token Selection */}
          <div>
            <Label required className="mb-3 block">
              Target
            </Label>
            <div className="flex gap-3">
              {/* TON Button - Active */}
              <button
                type="button"
                className="flex items-center gap-2 px-6 py-3 border border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <span className="font-semibold text-blue-700">TON</span>
              </button>

              {/* USDC Button - Disabled */}
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  U
                </div>
                <span className="font-semibold text-gray-500">USDC</span>
              </button>

              {/* USDT Button - Disabled */}
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <span className="font-semibold text-gray-500">USDT</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Currently only TON is supported
            </p>
          </div>

          {/* Channel ID */}
          <div>
            <Label className="mb-3 block">Channel ID</Label>
            <div className="flex gap-2">
              <Input
                value={generatedChannelId || ""}
                placeholder="Generate your Channel ID"
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleGenerateChannelId}
                disabled={!leaderAddress || !!generatedChannelId}
                variant="outline"
              >
                Generate
              </Button>
            </div>
            {channelIdError && (
              <p className="text-sm text-red-500 mt-1">{channelIdError}</p>
            )}
            {!channelIdError && (
              <div className="mt-2 space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">
                    Salt (Optional)
                  </Label>
                  <Input
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="Enter custom salt or leave empty for auto-generation"
                    className="mt-1 text-sm"
                    disabled={!!generatedChannelId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {generatedChannelId
                      ? "Channel ID generated. Remember the salt to recover your channel ID later."
                      : "Custom salt helps you recover your channel ID. Leave empty to auto-generate."}
                  </p>
                </div>
                {leaderAddress && (
                  <p className="text-xs text-gray-500">
                    Leader: {leaderAddress.slice(0, 6)}...
                    {leaderAddress.slice(-4)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Number of Participants - Auto-counted */}
          <div>
            <Label className="mb-2 block">Number of Participants</Label>
            <div className="text-3xl font-bold text-blue-600">
              {validAddressCount}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Minimum {CHANNEL_PARTICIPANTS.MIN}, Maximum{" "}
              {CHANNEL_PARTICIPANTS.MAX} participants
            </p>
          </div>

          {/* Participants Address - Dynamic Fields */}
          <div>
            <Label required className="mb-3 block">
              Participants Address
            </Label>
            <div className="space-y-3">
              {participants.map((participant, index) => {
                const validation = addressValidation[index];
                const showError = !validation.isEmpty && !validation.isValid;
                const showSuccess = !validation.isEmpty && validation.isValid;

                return (
                  <div key={index} className="relative">
                    <Input
                      value={participant.address}
                      onChange={(e) =>
                        updateParticipant(
                          index,
                          e.target.value as `0x${string}`
                        )
                      }
                      placeholder="Enter Ethereum address (0x...)"
                      className={`pr-10 w-full font-mono text-sm ${
                        showError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : showSuccess
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                          : ""
                      }`}
                    />
                    {/* Validation Icon */}
                    {showSuccess && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Error Message */}
                    {showError && (
                      <p className="text-xs text-red-500 mt-1 text-right">
                        Please enter a valid Ethereum address
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {createError}
            </div>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              Transaction: {txHash}
              {isConfirming && " (Confirming...)"}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleCreateChannel}
            disabled={
              !generatedChannelId ||
              validAddressCount < CHANNEL_PARTICIPANTS.MIN ||
              validAddressCount > CHANNEL_PARTICIPANTS.MAX ||
              isCreating ||
              isConfirming ||
              !isConnected
            }
            className="w-full"
          >
            {isCreating || isConfirming
              ? "Creating Channel..."
              : "Create Channel"}
          </Button>

          {/* Debug Info */}
          {!isConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              Please connect your wallet to create a channel
            </div>
          )}
          {validAddressCount < 2 && isConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              Please add at least 2 valid participant addresses
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
