/**
 * Join Channel Page
 *
 * Page for joining an existing channel
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button, Input, Label, Card, CardContent, CardHeader } from "@tokamak/ui";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { recoverChannelId } from "@/lib/channelId";
import { type Address } from "viem";
import { useBridgeCoreRead } from "@/hooks/contract";

// Validate bytes32 format (0x + 64 hex characters)
function isValidBytes32(value: string): boolean {
  if (!value || value.trim() === "") return false;
  
  // Must start with 0x
  if (!value.startsWith("0x") && !value.startsWith("0X")) return false;
  
  // Remove 0x prefix
  const hexPart = value.slice(2);
  
  // Must be exactly 64 hex characters
  if (hexPart.length !== 64) return false;
  
  // Must be valid hex characters
  return /^[0-9a-fA-F]{64}$/.test(hexPart);
}

export default function JoinChannelPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId, setCurrentChannelId } = useChannelFlowStore();
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<string | null>(null);
  
  // Channel ID recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [leaderAddress, setLeaderAddress] = useState("");
  const [salt, setSalt] = useState("");
  const [recoveredChannelId, setRecoveredChannelId] = useState<`0x${string}` | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Check if connected wallet is a participant of the channel
  const { data: isParticipant, isLoading: isCheckingParticipant, error: participantCheckError } = useBridgeCoreRead({
    functionName: "isChannelParticipant",
    args: channelId && isValidBytes32(channelId) && address
      ? [channelId as `0x${string}`, address]
      : undefined,
    query: {
      enabled: isConnected && !!address && !!channelId && isValidBytes32(channelId),
      refetchInterval: false,
    },
  });

  // Pre-fill with stored channel ID if available
  useEffect(() => {
    if (currentChannelId) {
      setChannelId(currentChannelId);
    }
  }, [currentChannelId]);

  // Validate channel ID format on input change
  useEffect(() => {
    if (!channelId || channelId.trim() === "") {
      setValidationError(null);
      setParticipantError(null);
      return;
    }

    if (!isValidBytes32(channelId)) {
      setValidationError("Channel ID must be a valid bytes32 format (0x + 64 hex characters)");
      setParticipantError(null);
    } else {
      setValidationError(null);
    }
  }, [channelId]);

  // Check participant status when channel ID is valid and wallet is connected
  useEffect(() => {
    if (!isConnected || !address || !channelId || !isValidBytes32(channelId)) {
      setParticipantError(null);
      return;
    }

    if (isCheckingParticipant) {
      // Still checking, don't show error yet
      setParticipantError(null);
      return;
    }

    if (participantCheckError) {
      setParticipantError("Failed to check participant status. Please try again.");
      return;
    }

    if (isParticipant === false) {
      setParticipantError("Your wallet address is not registered as a participant in this channel.");
    } else if (isParticipant === true) {
      setParticipantError(null);
    }
  }, [isConnected, address, channelId, isParticipant, isCheckingParticipant, participantCheckError]);

  const handleJoinChannel = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!channelId || channelId.trim() === "") {
      setError("Please enter a channel ID");
      return;
    }

    if (!isValidBytes32(channelId)) {
      setError("Invalid channel ID format. Must be bytes32 (0x + 64 hex characters)");
      return;
    }

    // Check participant status before proceeding
    if (isParticipant === false) {
      setError("Your wallet address is not registered as a participant in this channel.");
      return;
    }

    if (isCheckingParticipant) {
      setError("Please wait while we verify your participant status...");
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Store channel ID in Zustand store (not in URL for privacy)
      setCurrentChannelId(channelId);

      // Navigate to state explorer without channel ID in URL
      router.push("/state-explorer");
    } catch (err) {
      console.error("Error joining channel:", err);
      setError("Failed to join channel. Please try again.");
      setIsChecking(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          Join Channel
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Enter a channel ID to join an existing channel
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <h3 className="text-lg font-semibold">Channel Information</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel ID Input */}
          <div>
            <Label htmlFor="channelId" required>
              Channel ID
            </Label>
            <Input
              id="channelId"
              type="text"
              value={channelId}
              onChange={(e) => {
                setChannelId(e.target.value);
                setError(null);
              }}
              placeholder="Enter channel ID (e.g., 0x...)"
              disabled={isChecking}
              className={`w-full font-mono text-sm ${
                validationError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : channelId && isValidBytes32(channelId)
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                  : ""
              }`}
            />
            {validationError && (
              <p className="text-xs text-red-500 mt-1">{validationError}</p>
            )}
            {!validationError && channelId && isValidBytes32(channelId) && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
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
                Valid bytes32 format
              </p>
            )}
            {!validationError && !channelId && (
              <p className="text-sm text-gray-500 mt-1">
                Enter the ID of the channel you want to join (bytes32 format)
              </p>
            )}
          </div>

          {/* Participant Status Check */}
          {isConnected && address && channelId && isValidBytes32(channelId) && (
            <div>
              {isCheckingParticipant && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                  Checking participant status...
                </div>
              )}
              {!isCheckingParticipant && isParticipant === true && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
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
                  You are registered as a participant in this channel
                </div>
              )}
              {participantError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {participantError}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              Please connect your wallet to join a channel
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleJoinChannel}
              disabled={
                !isConnected ||
                !channelId ||
                !isValidBytes32(channelId) ||
                isChecking ||
                isCheckingParticipant ||
                isParticipant === false
              }
              className="flex-1"
            >
              {isChecking || isCheckingParticipant ? "Checking..." : "Join Channel"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isChecking}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
