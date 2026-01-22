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
 * - P: Number of pre-allocated keys (fetched from contract per token)
 * - S: Number of selected tokens (storage slots per user)
 */
export const MERKLE_TREE_CONFIG = {
  /** Number of Merkle tree leaves (L) */
  LEAVES: 16,
} as const;

/**
 * Supported Tokens Configuration
 *
 * Token addresses for each supported token.
 * Pre-allocated keys (P) are fetched from contract dynamically.
 */
export const SUPPORTED_TOKENS = {
  TON: {
    symbol: "TON",
    name: "Tokamak Network",
    address: "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044" as `0x${string}`,
    enabled: true,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: Add real address
    enabled: false, // Not yet supported
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: Add real address
    enabled: false, // Not yet supported
  },
} as const;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

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
