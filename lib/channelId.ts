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

/**
 * Convert channel ID to bytes32 format
 * 
 * Smart contracts expect channelId as bytes32 type.
 * This function converts various input types to bytes32 format.
 * 
 * @param channelId - Channel ID in various formats (bigint, string, or already bytes32)
 * @returns Channel ID in bytes32 format (0x + 64 hex characters)
 * 
 * @example
 * ```typescript
 * // From bigint
 * const bytes32Id = toBytes32(BigInt(123));
 * // Result: "0x000000000000000000000000000000000000000000000000000000000000007b"
 * 
 * // From hex string (already bytes32)
 * const bytes32Id = toBytes32("0x97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde6");
 * // Result: same string (validated)
 * 
 * // From numeric string
 * const bytes32Id = toBytes32("123");
 * // Result: "0x000000000000000000000000000000000000000000000000000000000000007b"
 * ```
 */
export function toBytes32(
  channelId: bigint | string | `0x${string}` | null | undefined
): `0x${string}` | undefined {
  if (!channelId) return undefined;
  
  if (typeof channelId === "bigint") {
    // Convert bigint to bytes32 (pad to 64 hex characters = 32 bytes)
    return `0x${channelId.toString(16).padStart(64, "0")}` as `0x${string}`;
  }
  
  if (typeof channelId === "string") {
    // If already starts with 0x, validate and pad if needed
    if (channelId.startsWith("0x") || channelId.startsWith("0X")) {
      const hexPart = channelId.slice(2);
      // If already 64 characters, return as-is
      if (hexPart.length === 64) {
        return channelId.toLowerCase() as `0x${string}`;
      }
      // Pad to 64 characters
      return `0x${hexPart.padStart(64, "0").slice(0, 64)}` as `0x${string}`;
    }
    
    // Try to parse as number and convert
    try {
      const num = BigInt(channelId);
      return `0x${num.toString(16).padStart(64, "0")}` as `0x${string}`;
    } catch {
      throw new Error(`Invalid channelId format: ${channelId}`);
    }
  }
  
  // Already bytes32 format
  return channelId;
}
