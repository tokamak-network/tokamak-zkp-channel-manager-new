/**
 * Join Channel Page
 *
 * Page for joining an existing channel
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button, Input, Label, Card, CardContent, CardHeader } from "@tokamak/ui";
import { useBridgeCoreReadContract } from "@/hooks/contract";

export default function JoinChannelPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Read channel info to check if user is a participant
  const { data: channelInfo } = useBridgeCoreReadContract({
    functionName: "getChannelInfo",
    args: channelId ? [BigInt(channelId)] : undefined,
    query: {
      enabled: !!channelId && channelId.length > 0,
    },
  });

  const handleJoinChannel = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!channelId || channelId.trim() === "") {
      setError("Please enter a channel ID");
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Check if channel info exists
      if (!channelInfo) {
        setError("Channel not found. Please check the channel ID.");
        setIsChecking(false);
        return;
      }

      // Extract whitelisted addresses from channel info
      // channelInfo structure: [targetContract, whitelisted[], enableFrostSignature, currentStateHash, ...]
      const whitelisted = channelInfo[1] as `0x${string}`[];

      // Check if current address is in the whitelisted participants
      const isParticipant = whitelisted.some(
        (participant) => participant.toLowerCase() === address.toLowerCase()
      );

      if (!isParticipant) {
        setError("You are not a participant of this channel");
        setIsChecking(false);
        return;
      }

      // Navigate to state explorer if user is a participant
      router.push(`/state-explorer?channelId=${channelId}`);
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
              placeholder="Enter channel ID (e.g., 1, 2, 3...)"
              disabled={isChecking}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the ID of the channel you want to join
            </p>
          </div>

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
              disabled={!isConnected || !channelId || isChecking}
              className="flex-1"
            >
              {isChecking ? "Checking..." : "Join Channel"}
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
