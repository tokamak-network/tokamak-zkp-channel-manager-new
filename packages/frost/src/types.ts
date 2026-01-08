/**
 * FROST DKG Types
 */

/**
 * DKG Session Status
 */
export type DKGStatus = 'waiting' | 'round1' | 'round2' | 'completed' | 'failed';

/**
 * DKG Session
 */
export interface DKGSession {
  id: string;
  channelId: string;
  status: DKGStatus;
  createdAt: number;
  completedAt?: number;
  participants: DKGParticipant[];
  threshold: number;
  groupPublicKey?: string;
  error?: string;
}

/**
 * DKG Participant
 */
export interface DKGParticipant {
  address: string;
  index: number;
  isReady: boolean;
  round1Complete: boolean;
  round2Complete: boolean;
  publicKeyShare?: string;
}

/**
 * DKG Round 1 Data
 */
export interface DKGRound1Data {
  commitment: string;
  proofOfKnowledge: string;
}

/**
 * DKG Round 2 Data
 */
export interface DKGRound2Data {
  encryptedShares: Record<string, string>;
}

/**
 * DKG Result
 */
export interface DKGResult {
  success: boolean;
  groupPublicKey?: string;
  participantShares?: Record<string, string>;
  error?: string;
}

/**
 * Threshold Signature
 */
export interface ThresholdSignature {
  r: string;
  s: string;
  participants: number[];
}

/**
 * Signing Session
 */
export interface SigningSession {
  id: string;
  channelId: string;
  message: string;
  status: 'pending' | 'signing' | 'completed' | 'failed';
  participants: number[];
  signature?: ThresholdSignature;
}

/**
 * FROST Configuration
 */
export interface FrostConfig {
  wasmPath?: string;
  serverUrl?: string;
  timeout?: number;
}

