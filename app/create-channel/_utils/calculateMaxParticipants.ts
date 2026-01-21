/**
 * Calculate Maximum Participants Utility
 *
 * Dynamically calculates the maximum number of participants
 * based on Merkle tree configuration.
 *
 * Formula: N = (L - P) / S
 *
 * Where:
 * - L: Number of Merkle tree leaves
 * - P: Number of pre-allocated keys (reserved slots)
 * - S: Number of storage slots per user
 */

import { MERKLE_TREE_CONFIG } from "@tokamak/config";

/**
 * Calculate maximum participants for a channel
 *
 * @param tokenCount - Number of tokens in the channel (default: 1)
 * @returns Maximum number of participants
 *
 * @example
 * // Single token (e.g., TON only)
 * calculateMaxParticipants(1) // Returns 16
 *
 * // Multiple tokens (e.g., TON + USDT)
 * calculateMaxParticipants(2) // Returns 8
 */
export function calculateMaxParticipants(tokenCount: number = 1): number {
  const { LEAVES, PRE_ALLOCATED_KEYS, USER_STORAGE_SLOTS } = MERKLE_TREE_CONFIG;
  const totalStorageSlotsPerUser = USER_STORAGE_SLOTS * tokenCount;
  return Math.floor((LEAVES - PRE_ALLOCATED_KEYS) / totalStorageSlotsPerUser);
}
