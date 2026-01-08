/**
 * 채널 관련 타입 정의
 */

export type ChannelStatus = 'pending' | 'active' | 'frozen' | 'closed';

export interface Channel {
  id: string;
  name: string;
  status: ChannelStatus;
  createdAt: number;
  updatedAt: number;
  
  // 참여자
  participants: string[];
  threshold: number;
  
  // 자금
  totalDeposit: bigint;
  balances: Record<string, bigint>;
  
  // DKG
  groupPublicKey?: string;
  dkgSessionId?: string;
  
  // 상태
  stateRoot?: string;
  stateVersion: number;
}

export interface ChannelState {
  version: number;
  root: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface CreateChannelParams {
  name: string;
  participants: string[];
  threshold: number;
  initialDeposit?: bigint;
}

export interface ChannelWithBalance extends Channel {
  userBalance: bigint;
  userShare: number; // percentage
}

