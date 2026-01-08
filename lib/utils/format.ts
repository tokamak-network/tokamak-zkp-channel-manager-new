/**
 * Formatting Utilities
 */

/**
 * Format Ethereum address
 */
export function formatAddress(address?: `0x${string}` | string | null): string {
  if (!address) return 'Not connected';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format balance
 */
export function formatBalance(value: bigint, decimals: number = 18, precision: number = 4): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const fractional = Number(remainder) / Number(divisor);
  const fractionalStr = fractional.toFixed(precision).replace(/\.?0+$/, '');
  
  return `${whole}.${fractionalStr.slice(2)}`;
}

/**
 * Format transaction hash
 */
export function formatTxHash(hash: string): string {
  if (hash.length < 10) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

