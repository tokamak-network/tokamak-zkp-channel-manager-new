/**
 * Custom Hook: Channel Info
 *
 * Fetches channel information from blockchain using channel ID
 * This hook aggregates multiple contract calls to provide complete channel data
 */

import { useMemo } from "react";
import { useBridgeCoreRead } from "@/hooks/contract";

interface ChannelInfo {
  targetContract: `0x${string}` | null;
  state: number; // ChannelState enum (0=None, 1=Initialized, 2=Open, 3=Closing, 4=Closed)
  participantCount: number;
  participants: `0x${string}`[] | null;
  initialRoot: `0x${string}` | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching complete channel information from blockchain
 *
 * @param channelId - The channel ID to fetch information for
 * @returns Channel information including targetContract, state, participants, etc.
 */
export function useChannelInfo(channelId: bigint | null | undefined): ChannelInfo {
  // Fetch basic channel info
  const {
    data: channelInfo,
    isLoading: isLoadingInfo,
    error: infoError,
  } = useBridgeCoreRead({
    functionName: "getChannelInfo",
    args: channelId !== null && channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== null && channelId !== undefined,
    },
  });

  // Fetch channel participants
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    error: participantsError,
  } = useBridgeCoreRead({
    functionName: "getChannelParticipants",
    args: channelId !== null && channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== null && channelId !== undefined,
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
