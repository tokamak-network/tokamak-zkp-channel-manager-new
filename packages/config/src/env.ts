/**
 * Environment Configuration
 *
 * Access environment variables with type safety
 */

/**
 * Application Mode
 * - PRODUCTION: Mainnet (Ethereum)
 * - DEV: Testnet (Sepolia)
 */
export type AppMode = 'PRODUCTION' | 'DEV';

/**
 * Required environment variables
 */
export const ENV = {
  /** Current environment */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /** Is production */
  IS_PROD: process.env.NODE_ENV === 'production',

  /** Is development */
  IS_DEV: process.env.NODE_ENV === 'development',

  /** Application mode (PRODUCTION = Mainnet, DEV = Testnet) */
  MODE: (process.env.NEXT_PUBLIC_MODE || process.env.MODE || 'DEV') as AppMode,

  /** Is production mode (Mainnet) */
  IS_PRODUCTION_MODE: (process.env.NEXT_PUBLIC_MODE || process.env.MODE) === 'PRODUCTION',
} as const;

/**
 * Get L1 network name based on current mode
 * @returns "Ethereum" for PRODUCTION, "Sepolia" for DEV
 */
export function getL1NetworkName(): string {
  return ENV.IS_PRODUCTION_MODE ? 'Ethereum' : 'Sepolia';
}

/**
 * Optional environment variables with defaults
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable
 */
export function getEnvOptional(key: string): string | undefined {
  return process.env[key];
}

/**
 * Validate required environment variables exist
 */
export function validateEnv(keys: string[]): void {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

