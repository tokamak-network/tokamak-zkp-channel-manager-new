/**
 * DKG (Distributed Key Generation) 관련 타입 정의
 */

export type DKGStatus = 'waiting' | 'round1' | 'round2' | 'completed' | 'failed';

export interface DKGSession {
  id: string;
  channelId: string;
  status: DKGStatus;
  createdAt: number;
  completedAt?: number;
  
  // 참여자
  participants: DKGParticipant[];
  threshold: number;
  
  // 결과
  groupPublicKey?: string;
  error?: string;
}

export interface DKGParticipant {
  address: string;
  index: number;
  isReady: boolean;
  round1Complete: boolean;
  round2Complete: boolean;
  publicKeyShare?: string;
}

export interface DKGRound1Data {
  commitment: string;
  proofOfKnowledge: string;
}

export interface DKGRound2Data {
  encryptedShares: Record<string, string>;
}

export interface DKGResult {
  success: boolean;
  groupPublicKey?: string;
  participantShares?: Record<string, string>;
  error?: string;
}

