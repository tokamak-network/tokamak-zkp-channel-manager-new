/**
 * ZK Proof 관련 타입 정의
 */

export interface ZKProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  protocol: 'groth16';
  curve: 'bn128';
}

export interface ProofInput {
  channelId: string;
  stateRoot: string;
  newStateRoot: string;
  stateVersion: number;
  signature?: ThresholdSignature;
}

export interface ThresholdSignature {
  r: string;
  s: string;
  participants: number[];
}

export interface ProofSubmission {
  id: string;
  channelId: string;
  proof: ZKProof;
  publicInputs: string[];
  status: 'pending' | 'verified' | 'rejected';
  txHash?: string;
  submittedAt: number;
  verifiedAt?: number;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  gasUsed?: bigint;
}

