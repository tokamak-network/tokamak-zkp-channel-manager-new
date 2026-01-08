/**
 * 공통 유틸리티 함수
 */

/**
 * 클래스명 병합 (tailwind-merge 대용 - 나중에 교체)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 주소 축약
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 숫자 포맷
 */
export function formatNumber(
  value: number | string,
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', options).format(num);
}

/**
 * 토큰 양 포맷 (wei → ether)
 */
export function formatTokenAmount(
  wei: bigint | string,
  decimals = 18,
  displayDecimals = 4
): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .slice(0, displayDecimals);
  
  return `${integerPart}.${fractionalStr}`;
}

/**
 * 지연 함수
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

