/**
 * Join Channel Page
 *
 * Page for joining an existing channel
 * Design based on Figma: https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3110-210829
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { isValidBytes32 } from "@/lib/channelId";
import { useChannelParticipantCheck } from "./_hooks/useChannelParticipantCheck";
import { Button, Input } from "@/components/ui";

export default function JoinChannelPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { currentChannelId, setCurrentChannelId } = useChannelFlowStore();
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check if connected wallet is a participant of the channel
  const {
    isParticipant,
    isChecking: isCheckingParticipant,
    error: participantError,
    isValidChannelId,
  } = useChannelParticipantCheck(channelId);

  // Pre-fill with stored channel ID if available
  useEffect(() => {
    if (currentChannelId) {
      setChannelId(currentChannelId);
    }
  }, [currentChannelId]);

  // Determine validation state
  const hasInput = Boolean(channelId && channelId.trim() !== "");
  const isFormatValid = hasInput && isValidBytes32(channelId);

  const handleJoinChannel = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!channelId || channelId.trim() === "") {
      setError("Please enter a channel ID");
      return;
    }

    if (!isValidChannelId) {
      setError(
        "Invalid channel ID format. Must be bytes32 (0x + 64 hex characters)"
      );
      return;
    }

    // Check participant status before proceeding
    if (isParticipant === false) {
      setError(
        "Your wallet address is not registered as a participant in this channel."
      );
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

  const isFormValid =
    isConnected &&
    isValidChannelId &&
    !isChecking &&
    !isCheckingParticipant &&
    isParticipant !== false;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-16" style={{ width: 1081 }}>
        {/* Title + Description */}
        <div
          className="flex flex-col justify-between items-center"
          style={{ width: 700, height: 107, gap: 12 }}
        >
          {/* Title */}
          <h1
            className="font-jersey text-center tracking-[0.01em]"
            style={{ fontSize: 64, lineHeight: "100%" }}
          >
            Join Channel
          </h1>

          {/* Description */}
          <p
            className="font-mono font-normal text-center text-[#666666]"
            style={{ fontSize: 20, lineHeight: "100%", letterSpacing: "0%" }}
          >
            Enter the Channel ID shared by the channel creator to join
          </p>
        </div>

        {/* Input + Button Row */}
        <div className="flex items-center gap-2">
          {/* Channel ID Input */}
          <div style={{ width: 825 }}>
            <Input
              value={channelId}
              onChange={(e) => {
                setChannelId(e.target.value);
                setError(null);
              }}
              placeholder="Enter channel ID"
              disabled={isChecking}
              error={hasInput && !isFormatValid}
              success={isFormatValid && isParticipant === true}
            />
          </div>

          {/* Join Button */}
          <div style={{ width: 240 }}>
            <Button
              variant="purple"
              size="full"
              onClick={handleJoinChannel}
              disabled={!isFormValid}
            >
              {isChecking || isCheckingParticipant ? "Checking..." : "Join Channel"}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {hasInput && !isFormatValid && (
          <p className="font-mono text-sm text-red-500 -mt-12">
            Channel ID must be a valid bytes32 format (0x + 64 hex characters)
          </p>
        )}
        {isFormatValid && isCheckingParticipant && (
          <p className="font-mono text-sm text-[#2A72E5] -mt-12">
            Checking participant status...
          </p>
        )}
        {isFormatValid && !isCheckingParticipant && isParticipant === false && (
          <p className="font-mono text-sm text-red-500 -mt-12">
            Your wallet address is not registered as a participant in this channel
          </p>
        )}
        {participantError && isParticipant !== false && (
          <p className="font-mono text-sm text-red-500 -mt-12">
            {participantError}
          </p>
        )}
        {error && (
          <p className="font-mono text-sm text-red-500 -mt-12">{error}</p>
        )}
        {!isConnected && (
          <p className="font-mono text-sm text-yellow-600 -mt-12">
            Please connect your wallet to join a channel
          </p>
        )}
      </div>
    </div>
  );
}
