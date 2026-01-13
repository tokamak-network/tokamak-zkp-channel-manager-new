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
 * - state >= 2 (Open or later): Uses getChannelParticipants (temporary workaround)
 *   - After initializeChannelState is called, channel state becomes Open (2)
 *   - Currently uses getChannelParticipants and filters array (isChannelParticipant has issues)
 *   - TODO: Switch back to isChannelParticipant once contract function is fixed
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
  // state >= 2 (Open or later): use getChannelParticipants and filter array (temporary workaround)
  const useWhitelistCheck = useMemo(() => {
    if (!channelInfo || channelInfo.isLoading) return undefined;
    // state < 2 means before initializeChannelState is called
    // state === 0: None (before deposits)
    // state === 1: Initialized (deposits complete, but initializeChannelState not called yet)
    // state >= 2: Open (initializeChannelState called)
    return channelInfo.state < 2;
  }, [channelInfo]);

  // For whitelist check (state < 2): use isChannelWhitelisted
  const whitelistCheckArgs = useMemo(() => {
    if (!isValidChannelId || !address || !useWhitelistCheck) return undefined;
    return [channelId as `0x${string}`, address] as const;
  }, [isValidChannelId, channelId, address, useWhitelistCheck]);

  // For participant check (state >= 2): use getChannelParticipants
  const participantsCheckArgs = useMemo(() => {
    if (!isValidChannelId || useWhitelistCheck !== false) return undefined;
    return [channelId as `0x${string}`] as const;
  }, [isValidChannelId, channelId, useWhitelistCheck]);

  // Get whitelist status (for state < 2)
  const {
    data: isWhitelistedRaw,
    isLoading: isCheckingWhitelist,
    error: whitelistCheckError,
  } = useBridgeCoreRead({
    functionName: "isChannelWhitelisted",
    args: whitelistCheckArgs,
    query: {
      enabled:
        isConnected &&
        !!address &&
        isValidChannelId &&
        useWhitelistCheck === true &&
        !channelInfo.isLoading,
      refetchInterval: false,
    },
  });

  // Get participants array (for state >= 2) - temporary workaround for isChannelParticipant
  const {
    data: participantsArray,
    isLoading: isCheckingParticipants,
    error: participantsCheckError,
  } = useBridgeCoreRead({
    functionName: "getChannelParticipants",
    args: participantsCheckArgs,
    query: {
      enabled:
        isConnected &&
        !!address &&
        isValidChannelId &&
        useWhitelistCheck === false &&
        !channelInfo.isLoading,
      refetchInterval: false,
    },
  });

  // Convert whitelist result to boolean
  const isWhitelisted = useMemo(() => {
    if (isWhitelistedRaw === undefined) return undefined;
    if (typeof isWhitelistedRaw === "boolean") return isWhitelistedRaw;
    if (typeof isWhitelistedRaw === "bigint")
      return isWhitelistedRaw !== BigInt(0);
    return Boolean(isWhitelistedRaw);
  }, [isWhitelistedRaw]);

  // Check if address is in participants array (for state >= 2)
  // TODO: Replace with isChannelParticipant once contract function is fixed
  const isParticipantFromArray = useMemo(() => {
    if (!address || !participantsArray) return undefined;
    if (!Array.isArray(participantsArray)) return false;

    // Check if address (case-insensitive) is in participants array
    return participantsArray.some(
      (participant) =>
        typeof participant === "string" &&
        participant.toLowerCase() === address.toLowerCase()
    );
  }, [address, participantsArray]);

  // Combine results based on state
  const isParticipant = useMemo(() => {
    if (useWhitelistCheck === undefined) return undefined;
    if (useWhitelistCheck) {
      return isWhitelisted;
    } else {
      return isParticipantFromArray;
    }
  }, [useWhitelistCheck, isWhitelisted, isParticipantFromArray]);

  // Combined loading state
  const isCheckingParticipant = useMemo(() => {
    if (useWhitelistCheck === undefined) return true;
    return useWhitelistCheck ? isCheckingWhitelist : isCheckingParticipants;
  }, [useWhitelistCheck, isCheckingWhitelist, isCheckingParticipants]);

  // Combined error state
  const participantCheckError = useMemo(() => {
    if (useWhitelistCheck === undefined) return null;
    return useWhitelistCheck ? whitelistCheckError : participantsCheckError;
  }, [useWhitelistCheck, whitelistCheckError, participantsCheckError]);

  // Debug logging
  useEffect(() => {
    if (isValidChannelId && address && !isCheckingParticipant) {
      const participantsList = Array.isArray(participantsArray)
        ? participantsArray
            .map((p) => (typeof p === "string" ? p : String(p)))
            .filter((p): p is string => typeof p === "string")
        : null;

      console.log("[useChannelParticipantCheck] State:", {
        channelId,
        address,
        channelState: channelInfo?.state,
        useWhitelistCheck,
        isWhitelisted,
        isParticipantFromArray,
        isParticipant,
        participantsArray: participantsList,
        isCheckingParticipant,
        error: participantCheckError,
      });
    }
  }, [
    channelId,
    address,
    channelInfo?.state,
    useWhitelistCheck,
    isWhitelisted,
    isParticipantFromArray,
    isParticipant,
    participantsArray,
    isCheckingParticipant,
    participantCheckError,
    isValidChannelId,
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
