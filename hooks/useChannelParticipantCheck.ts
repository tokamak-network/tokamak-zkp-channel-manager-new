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
 * - Special case: state === 4 (Closed) but user has pending withdrawal
 *   - Even if channel appears closed, users with withdrawable amount can join to withdraw
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
import { useWithdrawableAmount } from "@/hooks/useWithdrawableAmount";

// Error types for channel validation
export type ChannelErrorType =
  | "invalid_format" // Channel ID format is invalid
  | "not_found" // Channel does not exist
  | "not_participant" // User is not a participant
  | "check_failed" // Failed to check participant status
  | null;

interface UseChannelParticipantCheckResult {
  isParticipant: boolean | undefined;
  isChecking: boolean;
  error: string | null;
  errorType: ChannelErrorType;
  isValidChannelId: boolean;
  channelExists: boolean | undefined;
  /** Whether user has pending withdrawal amount (for closed channels) */
  hasPendingWithdrawal: boolean | undefined;
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

  // Check if channel exists (targetContract is not zero address)
  const channelExists = useMemo(() => {
    if (!channelInfo || channelInfo.isLoading) return undefined;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    return (
      channelInfo.targetContract !== null &&
      channelInfo.targetContract.toLowerCase() !== zeroAddress.toLowerCase()
    );
  }, [channelInfo]);

  // Determine which function to use based on channel state
  // state < 2 (None or Initialized): use isChannelWhitelisted (before initializeChannelState)
  // state >= 2 (Open or later): use getChannelParticipants and filter array (temporary workaround)
  const useWhitelistCheck = useMemo(() => {
    if (!channelInfo || channelInfo.isLoading) return undefined;
    if (!channelExists) return undefined; // Channel doesn't exist
    // state < 2 means before initializeChannelState is called
    // state === 0: None (before deposits)
    // state === 1: Initialized (deposits complete, but initializeChannelState not called yet)
    // state >= 2: Open (initializeChannelState called)
    return channelInfo.state < 2;
  }, [channelInfo, channelExists]);

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

  // Check for pending withdrawal using common hook
  // This handles the case where channel data might be reset (state 0) but withdrawal data still exists
  const {
    hasWithdrawableAmount: hasPendingWithdrawal,
    isLoading: isCheckingWithdrawable,
    withdrawableAmount,
    targetContract: withdrawTargetContract,
  } = useWithdrawableAmount({
    channelId: isValidChannelId ? channelId : null,
  });

  // Debug log for withdrawal check
  useEffect(() => {
    if (isValidChannelId && address) {
      console.log("[useChannelParticipantCheck] Withdrawal check (via useWithdrawableAmount):", {
        channelId,
        address,
        hasPendingWithdrawal,
        withdrawableAmount: withdrawableAmount.toString(),
        isCheckingWithdrawable,
        withdrawTargetContract,
        channelState: channelInfo?.state,
        channelExists,
        channelTargetContract: channelInfo?.targetContract,
      });
    }
  }, [
    channelId, 
    address, 
    hasPendingWithdrawal,
    withdrawableAmount,
    isCheckingWithdrawable, 
    withdrawTargetContract,
    channelInfo?.state,
    channelExists,
    channelInfo?.targetContract,
    isValidChannelId,
  ]);

  // Combine results based on state
  // For state 4 or 0: allow if has pending withdrawal OR is participant
  const isParticipant = useMemo(() => {
    // If channel is closed (state 4) or reset (state 0), check pending withdrawal first
    if (channelInfo?.state === 4 || (channelInfo?.state === 0 && hasPendingWithdrawal !== undefined)) {
      if (hasPendingWithdrawal === true) {
        return true; // User can join to withdraw
      }
      // If no pending withdrawal for state 0, channel doesn't exist
      if (channelInfo?.state === 0 && hasPendingWithdrawal === false) {
        return undefined; // Let channelExists check handle this
      }
      // For state 4 without pending withdrawal, fall through to participant check
    }
    
    if (useWhitelistCheck === undefined) return undefined;
    if (useWhitelistCheck) {
      return isWhitelisted;
    } else {
      return isParticipantFromArray;
    }
  }, [useWhitelistCheck, isWhitelisted, isParticipantFromArray, channelInfo?.state, hasPendingWithdrawal]);

  // Combined loading state
  const isCheckingParticipant = useMemo(() => {
    // Always wait for withdrawal check to complete (important for detecting closed channels)
    if (isCheckingWithdrawable) {
      return true;
    }
    if (useWhitelistCheck === undefined) return true;
    return useWhitelistCheck ? isCheckingWhitelist : isCheckingParticipants;
  }, [useWhitelistCheck, isCheckingWhitelist, isCheckingParticipants, isCheckingWithdrawable]);

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
        hasPendingWithdrawal,
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
    hasPendingWithdrawal,
    participantsArray,
    isCheckingParticipant,
    participantCheckError,
    isValidChannelId,
  ]);

  // Determine error message and type
  const { error, errorType } = useMemo((): {
    error: string | null;
    errorType: ChannelErrorType;
  } => {
    // No input yet
    if (!channelId) {
      return { error: null, errorType: null };
    }

    // Invalid format
    if (!isValidChannelId) {
      return {
        error: "Invalid Channel ID format. Must be 0x followed by 64 hexadecimal characters.",
        errorType: "invalid_format",
      };
    }

    // Not connected
    if (!isConnected || !address) {
      return { error: null, errorType: null };
    }

    // Wait for channel info to load
    if (channelInfo.isLoading) {
      return { error: null, errorType: null };
    }

    // Channel doesn't exist - but check for pending withdrawals first
    // User might have pending withdrawal even if channel appears reset (state 0)
    if (channelExists === false) {
      console.log("[useChannelParticipantCheck] Channel doesn't exist check:", {
        channelExists,
        hasPendingWithdrawal,
        isCheckingWithdrawable,
        withdrawableAmount: withdrawableAmount.toString(),
      });
      
      // Still checking withdrawable amount - wait before showing error
      if (isCheckingWithdrawable) {
        return { error: null, errorType: null };
      }
      
      // If found pending withdrawal amount, don't show not_found error
      if (hasPendingWithdrawal === true) {
        console.log("[useChannelParticipantCheck] Has pending withdrawal, allowing join");
        return { error: null, errorType: null };
      }
      
      // Also check withdrawableAmount directly in case hasPendingWithdrawal is undefined
      if (withdrawableAmount > BigInt(0)) {
        console.log("[useChannelParticipantCheck] withdrawableAmount > 0, allowing join");
        return { error: null, errorType: null };
      }
      
      return {
        error: "Channel not found. Please check the Channel ID and try again.",
        errorType: "not_found",
      };
    }

    // Still checking participant status
    if (isCheckingParticipant) {
      return { error: null, errorType: null };
    }

    // Check failed
    if (participantCheckError) {
      return {
        error: "Failed to verify participant status. Please try again.",
        errorType: "check_failed",
      };
    }

    // Not a participant
    if (isParticipant === false) {
      return {
        error: "Your wallet address is not registered as a participant in this channel.",
        errorType: "not_participant",
      };
    }

    return { error: null, errorType: null };
  }, [
    isConnected,
    address,
    channelId,
    isValidChannelId,
    channelExists,
    isParticipant,
    isCheckingParticipant,
    participantCheckError,
    channelInfo.isLoading,
    hasPendingWithdrawal,
    isCheckingWithdrawable,
    withdrawableAmount,
  ]);

  return {
    isParticipant,
    isChecking: isCheckingParticipant,
    error,
    errorType,
    isValidChannelId,
    channelExists,
    hasPendingWithdrawal,
  };
}
