/**
 * Custom Hook: Channel Info
 *
 * Fetches channel information from blockchain using channel ID
 * This hook aggregates multiple contract calls to provide complete channel data
 *
 * @see docs/CHANNEL_STATE.md for detailed channel state reference
 */

import { useMemo } from "react";
import { useBridgeCoreRead } from "@/hooks/contract";

/**
 * Channel State Enum Values:
 * - 0: None - Channel not created or doesn't exist
 * - 1: Initialized - Channel created, deposit phase (before initializeChannelState)
 * - 2: Open - Channel is open, transaction phase (after initializeChannelState)
 * - 3: Closing - Channel is closing
 * - 4: Closed - Channel is closed, withdraw phase
 *
 * State Flow:
 * None (0) → Initialized (1) → Open (2) → Closing (3) → Closed (4)
 *
 * UI Mapping:
 * - state === 1: Deposit page
 * - state === 2: Transaction page
 * - state === 3, 4: Withdraw page
 *
 * Participant Check:
 * - state < 2: Use isChannelWhitelisted
 * - state >= 2: Use isChannelParticipant
 */
interface ChannelInfo {
  targetContract: `0x${string}` | null;
  /**
   * Channel state from contract (ChannelState enum)
   * @see docs/CHANNEL_STATE.md for detailed state reference
   *
   * 0: None - Channel not created
   * 1: Initialized - Deposit phase, before initializeChannelState
   * 2: Open - Transaction phase, after initializeChannelState
   * 3: Closing - Channel is closing
   * 4: Closed - Channel is closed, withdraw phase
   */
  state: number;
  participantCount: number;
  participants: `0x${string}`[] | null;
  initialRoot: `0x${string}` | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching complete channel information from blockchain
 *
 * @param channelId - The channel ID to fetch information for (bytes32 string or bigint)
 * @returns Channel information including targetContract, state, participants, etc.
 *
 * @example
 * ```typescript
 * const channelInfo = useChannelInfo(channelId);
 *
 * // Check state
 * if (channelInfo.state === 1) {
 *   // Initialized - show deposit page
 * } else if (channelInfo.state === 2) {
 *   // Open - show transaction page
 * } else if (channelInfo.state === 3 || channelInfo.state === 4) {
 *   // Closing or Closed - show withdraw page
 * }
 * ```
 */
export function useChannelInfo(
  channelId: bigint | `0x${string}` | null | undefined
): ChannelInfo {
  // Convert channelId to bytes32
  const channelIdBytes32 = useMemo(() => {
    if (!channelId) return undefined;
    if (typeof channelId === "bigint") {
      // Convert bigint to bytes32 (pad to 32 bytes)
      return `0x${channelId.toString(16).padStart(64, "0")}` as `0x${string}`;
    }
    return channelId as `0x${string}`;
  }, [channelId]);

  // Fetch basic channel info (uses bytes32)
  const {
    data: channelInfo,
    isLoading: isLoadingInfo,
    error: infoError,
  } = useBridgeCoreRead({
    functionName: "getChannelInfo",
    args: channelIdBytes32 ? [channelIdBytes32] : undefined,
    query: {
      enabled: !!channelIdBytes32,
    },
  });

  // Fetch channel participants (uses bytes32)
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    error: participantsError,
  } = useBridgeCoreRead({
    functionName: "getChannelParticipants",
    args: channelIdBytes32 ? [channelIdBytes32] : undefined,
    query: {
      enabled: !!channelIdBytes32,
    },
  });

  // Combine results
  const result = useMemo(() => {
    if (!channelId) {
      return {
        targetContract: null,
        state: 0,
        participantCount: 0,
        participants: null,
        initialRoot: null,
        isLoading: false,
        error: null,
      };
    }

    const isLoading = isLoadingInfo || isLoadingParticipants;
    const error = infoError || participantsError;

    // Parse channelInfo result
    // getChannelInfo returns: [targetContract, state, participantCount, initialRoot]
    const targetContract =
      channelInfo && Array.isArray(channelInfo) && channelInfo[0]
        ? (channelInfo[0] as `0x${string}`)
        : null;
    const state =
      channelInfo && Array.isArray(channelInfo) && channelInfo[1]
        ? Number(channelInfo[1])
        : 0;
    const participantCount =
      channelInfo && Array.isArray(channelInfo) && channelInfo[2]
        ? Number(channelInfo[2])
        : 0;
    const initialRoot =
      channelInfo && Array.isArray(channelInfo) && channelInfo[3]
        ? (channelInfo[3] as `0x${string}`)
        : null;

    // Parse participants result
    const participantsArray =
      participants && Array.isArray(participants)
        ? (participants as `0x${string}`[])
        : null;

    return {
      targetContract,
      state,
      participantCount,
      participants: participantsArray,
      initialRoot,
      isLoading,
      error: error ? (error as Error) : null,
    };
  }, [
    channelId,
    channelInfo,
    participants,
    isLoadingInfo,
    isLoadingParticipants,
    infoError,
    participantsError,
  ]);

  return result;
}
