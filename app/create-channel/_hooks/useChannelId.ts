/**
 * Custom Hook: useChannelId
 *
 * Handles channel ID generation using leader address and salt
 * Automatically regenerates channel ID when salt changes
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  // Track if initial generation has been done
  const [hasInitialGeneration, setHasInitialGeneration] = useState(false);
  // Track the last used salt for comparison (to avoid unnecessary re-renders)
  const lastUsedSaltRef = useRef<string>("");

  // Determine leader address (the account that calls openChannel() transaction)
  const leaderAddress = useMemo(() => {
    // The leader is the account that calls the openChannel() transaction
    // This is the connected wallet address
    return connectedAddress as Address | undefined;
  }, [connectedAddress]);

  // Internal function to compute channel ID
  const computeChannelId = useCallback((address: Address, saltValue: string): `0x${string}` => {
    return keccak256(
      encodePacked(
        ["address", "string"],
        [address, saltValue]
      )
    ) as `0x${string}`;
  }, []);

  // Auto-regenerate channel ID when salt changes (after initial generation)
  useEffect(() => {
    if (!hasInitialGeneration || !leaderAddress) return;
    
    const currentSalt = salt.trim();
    if (currentSalt === lastUsedSaltRef.current) return;
    
    // Only auto-regenerate if user has entered a non-empty salt
    if (currentSalt) {
      try {
        const channelId = computeChannelId(leaderAddress, currentSalt);
        setGeneratedChannelId(channelId);
        lastUsedSaltRef.current = currentSalt;
      } catch (error) {
        console.error("Error auto-regenerating channel ID:", error);
      }
    }
  }, [salt, leaderAddress, hasInitialGeneration, computeChannelId]);

  // Generate channel ID (initial generation or manual trigger)
  const generateChannelId = useCallback(() => {
    if (!leaderAddress) {
      throw new Error("Leader address is required. Please connect your wallet to generate a channel ID.");
    }

    // Use provided salt or auto-generate
    const finalSalt = salt.trim() || `${Date.now()}-${crypto.randomUUID()}`;

    try {
      const channelId = computeChannelId(leaderAddress, finalSalt);

      setGeneratedChannelId(channelId);
      setHasInitialGeneration(true);
      lastUsedSaltRef.current = finalSalt;

      // If salt was auto-generated, store it for display
      if (!salt.trim()) {
        setSalt(finalSalt);
      }

      return { channelId, salt: finalSalt };
    } catch (error) {
      console.error("Error generating channel ID:", error);
      throw new Error("Failed to generate channel ID");
    }
  }, [leaderAddress, salt, computeChannelId]);

  // Reset channel ID
  const resetChannelId = useCallback(() => {
    setGeneratedChannelId(null);
    setHasInitialGeneration(false);
    lastUsedSaltRef.current = "";
    setSalt("");
  }, []);

  return {
    salt,
    setSalt,
    generatedChannelId,
    hasInitialGeneration,
    leaderAddress,
    generateChannelId,
    resetChannelId,
  };
}
