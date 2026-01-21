/**
 * Application Constants
 */

export const APP_NAME = "Tokamak Private App Channels";
export const APP_VERSION = "0.1.0";

/**
 * Channel Status
 */
export const CHANNEL_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  FROZEN: "frozen",
  CLOSED: "closed",
} as const;

export type ChannelStatus =
  (typeof CHANNEL_STATUS)[keyof typeof CHANNEL_STATUS];

/**
 * Merkle Tree Configuration
 *
 * These values are used to calculate the maximum number of participants:
 * N = (L - P) / S
 *
 * Where:
 * - L: Number of Merkle tree leaves
 * - P: Number of pre-allocated keys (reserved slots)
 * - S: Number of storage slots per user
 */
export const MERKLE_TREE_CONFIG = {
  /** Number of Merkle tree leaves (L) */
  LEAVES: 16,
  /** Number of pre-allocated keys / reserved slots (P) */
  PRE_ALLOCATED_KEYS: 0,
  /** Number of storage slots per user (S) */
  USER_STORAGE_SLOTS: 1,
} as const;

/**
 * DKG Status
 */
export const DKG_STATUS = {
  WAITING: "waiting",
  ROUND1: "round1",
  ROUND2: "round2",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type DKGStatus = (typeof DKG_STATUS)[keyof typeof DKG_STATUS];

/**
 * Time Constants (milliseconds)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Transaction Settings
 */
export const TX_SETTINGS = {
  DEFAULT_GAS_LIMIT: BigInt(500000),
  CONFIRMATION_BLOCKS: 2,
} as const;

/**
 * Fixed Target Contract Address
 *
 * Default target contract address for channel creation
 */
export const FIXED_TARGET_CONTRACT =
  "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044" as `0x${string}`;

/**
 * TON Token Address (Sepolia testnet)
 */
export const TON_TOKEN_ADDRESS =
  "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044" as `0x${string}`;

/**
 * ERC20 Transfer function selectors and slot indices
 */
export const ERC20_TRANSFER: Record<
  `0x${string}`,
  { selector: `0x${string}`; slot: number }
> = {
  [TON_TOKEN_ADDRESS]: {
    selector: "0xa9059cbb",
    slot: 0,
  },
};
