/**
 * Channel ID Utilities
 *
 * Functions for generating and recovering channel IDs
 */

import { keccak256, encodePacked } from "viem";
import { type Address } from "viem";

/**
 * Validate bytes32 format (0x + 64 hex characters)
 * 
 * @param value - The string to validate
 * @returns true if the value is a valid bytes32 format
 */
export function isValidBytes32(value: string): boolean {
  if (!value || value.trim() === "") return false;
  
  // Must start with 0x
  if (!value.startsWith("0x") && !value.startsWith("0X")) return false;
  
  // Remove 0x prefix
  const hexPart = value.slice(2);
  
  // Must be exactly 64 hex characters
  if (hexPart.length !== 64) return false;
  
  // Must be valid hex characters
  return /^[0-9a-fA-F]{64}$/.test(hexPart);
}

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
