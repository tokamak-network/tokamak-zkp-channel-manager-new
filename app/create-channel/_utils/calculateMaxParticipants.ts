/**
 * Calculate Maximum Participants Utility
 *
 * Dynamically calculates the maximum number of participants
 * based on Merkle tree configuration and selected tokens.
 *
 * Formula: N = (L - P_total) / S
 *
 * Where:
 * - L: Number of Merkle tree leaves (16)
 * - P_total: Sum of pre-allocated keys for all selected tokens (from contract)
 * - S: Number of selected tokens (storage slots per user)
 */

import { MERKLE_TREE_CONFIG } from "@tokamak/config";

/**
 * Calculate maximum participants for a channel
 *
 * @param totalPreAllocatedCount - Sum of pre-allocated keys for all selected tokens (P)
 * @param selectedTokenCount - Number of selected tokens (S)
 * @returns Maximum number of participants (N)
 *
 * @example
 * // Single token (TON with P=1)
 * calculateMaxParticipants(1, 1) // Returns (16-1)/1 = 15
 *
 * // Multiple tokens (TON + USDT, each with P=1)
 * calculateMaxParticipants(2, 2) // Returns (16-2)/2 = 7
 */
export function calculateMaxParticipants(
  totalPreAllocatedCount: number,
  selectedTokenCount: number
): number {
  const { LEAVES } = MERKLE_TREE_CONFIG;

  // Ensure at least 1 token is selected
  const tokenCount = Math.max(1, selectedTokenCount);

  // N = (L - P_total) / S
  return Math.floor((LEAVES - totalPreAllocatedCount) / tokenCount);
}
