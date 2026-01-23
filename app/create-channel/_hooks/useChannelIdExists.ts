/**
 * Hook: useChannelIdExists
 *
 * Checks if a channel ID already exists on the contract.
 * Returns true if the channel state is not NonExistent (0).
 */

import { useBridgeCoreRead } from "@/hooks/contract";

/**
 * Channel State enum values from the contract
 * 0 = NonExistent (channel doesn't exist)
 * Other values = channel exists in various states
 */
const CHANNEL_STATE_NON_EXISTENT = 0n;

interface UseChannelIdExistsResult {
  /** Whether the channel ID already exists */
  exists: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
}

/**
 * Check if a channel ID already exists on the contract
 *
 * @param channelId - The channel ID to check (bytes32)
 * @returns Whether the channel exists
 *
 * @example
 * const { exists, isLoading } = useChannelIdExists(generatedChannelId);
 * if (exists) {
 *   // Show warning: channel ID already exists
 * }
 */
export function useChannelIdExists(
  channelId: `0x${string}` | null | undefined
): UseChannelIdExistsResult {
  const { data: channelState, isLoading, isError } = useBridgeCoreRead({
    functionName: "getChannelState",
    args: channelId ? [channelId] : undefined,
    query: { enabled: !!channelId },
  });

  // If channel state is not 0 (NonExistent), the channel exists
  // Convert to BigInt for safe comparison (handles both number and bigint returns)
  let exists = false;
  if (channelState !== undefined && channelState !== null) {
    try {
      const stateAsBigInt = BigInt(channelState.toString());
      exists = stateAsBigInt !== CHANNEL_STATE_NON_EXISTENT;
    } catch {
      // If conversion fails, assume it doesn't exist
      exists = false;
    }
  }

  return {
    exists,
    isLoading,
    isError,
  };
}
