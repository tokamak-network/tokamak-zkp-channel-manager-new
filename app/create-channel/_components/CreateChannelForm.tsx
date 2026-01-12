/**
 * Create Channel Form
 *
 * Form for creating a channel transaction
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useChannelFormStore } from "@/stores";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
} from "@tokamak/ui";
import { TransactionConfirmModal } from "./TransactionConfirmModal";
import { useCreateChannel } from "../_hooks/useCreateChannel";

export function CreateChannelForm() {
  const { isConnected } = useAccount();

  const {
    participants,
    updateParticipant,
    setParticipants,
    isValid,
  } = useChannelFormStore();

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize participant count from store
  const MAX_PARTICIPANTS = 128;

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
    isValid: p.address ? isValidEOA(p.address) : false,
    isEmpty: !p.address || p.address === "",
  }));

  // Count valid addresses (non-empty and valid)
  const validAddressCount = addressValidation.filter(
    (v) => !v.isEmpty && v.isValid
  ).length;

  // Determine if we should show a new empty field
  const shouldShowNewField =
    validAddressCount === participants.length && validAddressCount < MAX_PARTICIPANTS;

  // Auto-add new field when last field is filled with valid address
  useEffect(() => {
    if (shouldShowNewField) {
      setParticipants([
        ...participants,
        { address: "" as `0x${string}` },
      ]);
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

        {/* Number of Participants - Auto-counted */}
        <div>
          <Label className="mb-2 block">Number of Participants</Label>
          <div className="text-3xl font-bold text-blue-600">
            {validAddressCount}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Minimum 2, Maximum {MAX_PARTICIPANTS} participants
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
                      updateParticipant(index, e.target.value as `0x${string}`)
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
            validAddressCount < 2 ||
            validAddressCount > MAX_PARTICIPANTS ||
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
