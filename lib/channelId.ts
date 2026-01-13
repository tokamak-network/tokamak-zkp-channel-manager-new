/**
 * Channel ID Utilities
 *
 * Functions for generating and recovering channel IDs
 */

import { keccak256, encodePacked } from "viem";
import { type Address } from "viem";

/**
 * Compute channel ID from leader address and salt
 * 
 * @param leaderAddress - The leader's Ethereum address
 * @param salt - The salt string (can be user-provided or auto-generated)
 * @returns The computed channel ID (bytes32)
 */
export function computeChannelId(
  leaderAddress: Address,
  salt: string
): `0x${string}` {
  return keccak256(
    encodePacked(
      ["address", "string"],
      [leaderAddress, salt]
    )
  ) as `0x${string}`;
}

/**
 * Recover channel ID from leader address and salt
 * 
 * This is the same as computeChannelId, but named differently
 * to indicate it's for recovery purposes
 * 
 * @param leaderAddress - The leader's Ethereum address
 * @param salt - The salt string that was used during channel creation
 * @returns The recovered channel ID (bytes32)
 */
export function recoverChannelId(
  leaderAddress: Address,
  salt: string
): `0x${string}` {
  return computeChannelId(leaderAddress, salt);
}
