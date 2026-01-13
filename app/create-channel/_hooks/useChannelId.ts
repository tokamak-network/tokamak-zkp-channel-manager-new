/**
 * Custom Hook: useChannelId
 *
 * Handles channel ID generation using leader address and salt
 */

import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { type Address } from "viem";

interface UseChannelIdParams {
  participants: Array<{ address: `0x${string}` }>;
}

export function useChannelId({ participants }: UseChannelIdParams) {
  const { address: connectedAddress } = useAccount();
  const [salt, setSalt] = useState("");
  const [generatedChannelId, setGeneratedChannelId] = useState<`0x${string}` | null>(null);

  // Determine leader address (the account that calls openChannel() transaction)
  const leaderAddress = useMemo(() => {
    // The leader is the account that calls the openChannel() transaction
    // This is the connected wallet address
    return connectedAddress as Address | undefined;
  }, [connectedAddress]);

  // Generate channel ID
  const generateChannelId = useCallback(() => {
    if (!leaderAddress) {
      throw new Error("Leader address is required. Please connect your wallet to generate a channel ID.");
    }

    // Use provided salt or auto-generate
    const finalSalt = salt.trim() || `${Date.now()}-${crypto.randomUUID()}`;

    try {
      const channelId = keccak256(
        encodePacked(
          ["address", "string"],
          [leaderAddress, finalSalt]
        )
      ) as `0x${string}`;

      setGeneratedChannelId(channelId);
      
      // If salt was auto-generated, store it for display
      if (!salt.trim()) {
        setSalt(finalSalt);
      }

      return { channelId, salt: finalSalt };
    } catch (error) {
      console.error("Error generating channel ID:", error);
      throw new Error("Failed to generate channel ID");
    }
  }, [leaderAddress, salt]);

  // Reset channel ID
  const resetChannelId = useCallback(() => {
    setGeneratedChannelId(null);
    setSalt("");
  }, []);

  return {
    salt,
    setSalt,
    generatedChannelId,
    leaderAddress,
    generateChannelId,
    resetChannelId,
  };
}
