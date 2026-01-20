/**
 * Channel Domain Types
 */

export type ChannelStatus = 'pending' | 'active' | 'frozen' | 'closed';

export interface Channel {
  id: string;
  name: string;
  status: ChannelStatus;
  createdAt: number;
  updatedAt: number;

  // Participants
  participants: string[];
  threshold: number;

  // Funds
  totalDeposit: bigint;
  balances: Record<string, bigint>;

  // DKG
  groupPublicKey?: string;
  dkgSessionId?: string;

  // State
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
  userShare: number;
}

