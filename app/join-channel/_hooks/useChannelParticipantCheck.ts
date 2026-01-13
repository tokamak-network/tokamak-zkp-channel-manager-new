/**
 * Custom Hook: Channel Participant Check
 *
 * Checks if a connected wallet is a participant of a channel
 *
 * Based on channel state, uses different contract functions:
 * - state < 2 (None or Initialized): Uses isChannelWhitelisted
 *   - This is the deposit phase where users need to be whitelisted to deposit
 *   - state === 0: Channel created, before deposits
 *   - state === 1: Deposits complete, before initializeChannelState call
 *
 * - state >= 2 (Open or later): Uses isChannelParticipant
 *   - After initializeChannelState is called, channel state becomes Open (2)
 *   - isChannelParticipant checks if user is registered as participant
 *   - state === 2: initializeChannelState called, channel is open
 *   - state === 3: Channel is closing
 *   - state === 4: Channel is closed
 *
 * Note: In the contract, isParticipant is set to true during openChannel (state = 1),
 * but for join-channel page purposes, we use isChannelWhitelisted for state < 2
 * to check if user can join during deposit phase.
 */

import { useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { useBridgeCoreRead } from "@/hooks/contract";
import { isValidBytes32 } from "@/lib/channelId";
import { useChannelInfo } from "@/hooks/useChannelInfo";

interface UseChannelParticipantCheckResult {
  isParticipant: boolean | undefined;
  isChecking: boolean;
  error: string | null;
  isValidChannelId: boolean;
}

/**
 * Hook for checking if the connected wallet is a participant of a channel
 *
 * @param channelId - The channel ID to check (string)
 * @returns Object containing participant status, loading state, error, and validation status
 */
export function useChannelParticipantCheck(
  channelId: string | null | undefined
): UseChannelParticipantCheckResult {
  const { address, isConnected } = useAccount();

  // Validate channel ID format
  const isValidChannelId = useMemo(() => {
    if (!channelId) return false;
    return isValidBytes32(channelId);
  }, [channelId]);

  // Get channel info to determine state
  const channelInfo = useChannelInfo(
    isValidChannelId ? (channelId as `0x${string}`) : null
  );

  // Determine which function to use based on channel state
  // state < 2 (None or Initialized): use isChannelWhitelisted (before initializeChannelState)
  // state >= 2 (Open or later): use isChannelParticipant (after initializeChannelState)
  const useWhitelistCheck = useMemo(() => {
    if (!channelInfo || channelInfo.isLoading) return undefined;
    // state < 2 means before initializeChannelState is called
    // state === 0: None (before deposits)
    // state === 1: Initialized (deposits complete, but initializeChannelState not called yet)
    // state >= 2: Open (initializeChannelState called)
    return channelInfo.state < 2;
  }, [channelInfo]);

  // Check if connected wallet is a participant
  const contractArgs = useMemo(() => {
    if (!isValidChannelId || !address) return undefined;
    return [channelId as `0x${string}`, address] as const;
  }, [isValidChannelId, channelId, address]);

  // Determine function name based on channel state
  const functionName = useMemo(() => {
    if (useWhitelistCheck === undefined) return undefined;
    return useWhitelistCheck ? "isChannelWhitelisted" : "isChannelParticipant";
  }, [useWhitelistCheck]);

  // Debug logging
  useEffect(() => {
    if (isValidChannelId && address && contractArgs && functionName) {
      console.log("[useChannelParticipantCheck] Contract call params:", {
        functionName,
        channelId: contractArgs[0],
        address: contractArgs[1],
        channelIdLength: contractArgs[0]?.length,
        addressLength: contractArgs[1]?.length,
        channelState: channelInfo?.state,
        useWhitelistCheck,
        enabled: isConnected && !!address && isValidChannelId,
      });
    }
  }, [
    contractArgs,
    isValidChannelId,
    address,
    isConnected,
    functionName,
    channelInfo?.state,
    useWhitelistCheck,
  ]);

  const {
    data: isParticipantRaw,
    isLoading: isCheckingParticipant,
    error: participantCheckError,
  } = useBridgeCoreRead({
    functionName: functionName as
      | "isChannelWhitelisted"
      | "isChannelParticipant",
    args: contractArgs,
    query: {
      enabled:
        isConnected &&
        !!address &&
        isValidChannelId &&
        functionName !== undefined &&
        !channelInfo.isLoading,
      refetchInterval: false,
    },
  });

  // Convert result to boolean (contract returns bool, but wagmi might return it as bigint or other types)
  const isParticipant = useMemo(() => {
    if (isParticipantRaw === undefined) return undefined;
    if (typeof isParticipantRaw === "boolean") return isParticipantRaw;
    if (typeof isParticipantRaw === "bigint")
      return isParticipantRaw !== BigInt(0);
    return Boolean(isParticipantRaw);
  }, [isParticipantRaw]);

  // Debug logging for result
  useEffect(() => {
    if (!isCheckingParticipant && contractArgs && functionName) {
      console.log("[useChannelParticipantCheck] Result:", {
        functionName,
        isParticipant,
        isCheckingParticipant,
        error: participantCheckError,
        channelId: contractArgs[0],
        address: contractArgs[1],
        channelState: channelInfo?.state,
        useWhitelistCheck,
      });
    }
  }, [
    isParticipant,
    isCheckingParticipant,
    participantCheckError,
    contractArgs,
    functionName,
    channelInfo?.state,
    useWhitelistCheck,
  ]);

  // Determine error message
  const error = useMemo(() => {
    if (!isConnected || !address || !channelId || !isValidChannelId) {
      return null;
    }

    // Wait for channel info to load
    if (channelInfo.isLoading) {
      return null;
    }

    if (isCheckingParticipant) {
      // Still checking, don't show error yet
      return null;
    }

    if (participantCheckError) {
      return "Failed to check participant status. Please try again.";
    }

    if (isParticipant === false) {
      if (useWhitelistCheck) {
        return "Your wallet address is not whitelisted for this channel. Please wait for the channel to be initialized.";
      } else {
        return "Your wallet address is not registered as a participant in this channel.";
      }
    }

    return null;
  }, [
    isConnected,
    address,
    channelId,
    isValidChannelId,
    isParticipant,
    isCheckingParticipant,
    participantCheckError,
    channelInfo.isLoading,
    useWhitelistCheck,
  ]);

  return {
    isParticipant,
    isChecking: isCheckingParticipant,
    error,
    isValidChannelId,
  };
}
