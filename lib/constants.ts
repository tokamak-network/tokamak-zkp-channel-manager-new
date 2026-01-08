/**
 * 앱 상수 정의
 */

export const APP_NAME = 'Tokamak ZKP Channel Manager';

/**
 * 네트워크 설정
 */
export const SUPPORTED_CHAINS = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
  },
  // TODO: 메인넷 추가
} as const;

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.sepolia;

/**
 * 채널 상태
 */
export const CHANNEL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed',
} as const;

/**
 * DKG 상태
 */
export const DKG_STATUS = {
  WAITING: 'waiting',
  ROUND1: 'round1',
  ROUND2: 'round2',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * 시간 상수 (ms)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

