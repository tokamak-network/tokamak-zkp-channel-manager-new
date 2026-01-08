/**
 * Environment Configuration
 *
 * Access environment variables with type safety
 */

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
} as const;

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

