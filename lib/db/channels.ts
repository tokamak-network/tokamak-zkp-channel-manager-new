/**
 * Channel-specific Database Functions
 * 
 * High-level functions for channel operations
 */

import { getData, setData, pushData, updateData, deleteData } from './helpers';

// ============================================================================
// Channel Operations
// ============================================================================

/**
 * Channel data structure
 */
export interface Channel {
  channelId?: string;
  status?: 'pending' | 'active' | 'frozen' | 'closed';
  targetContract?: string;
  participants?: string[];
  initializationTxHash?: string;
  initializedAt?: string;
  initialProof?: any;
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any;
}

/**
 * Get channel by ID
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  const channel = await getData<Channel>(`channels.${channelId}`);
  if (!channel) return null;
  
  return {
    ...channel,
    channelId,
  };
}

/**
 * Get all channels
 */
export async function getAllChannels(): Promise<Channel[]> {
  const channelsData = await getData<Record<string, Channel>>('channels');
  if (!channelsData) return [];
  
  return Object.entries(channelsData).map(([id, channel]) => ({
    ...channel,
    channelId: id,
  }));
}

/**
 * Get all active channels
 */
export async function getActiveChannels(): Promise<Channel[]> {
  const allChannels = await getAllChannels();
  return allChannels.filter(channel => channel.status === 'active');
}

/**
 * Create or update a channel
 */
export async function saveChannel(channelId: string, channelData: Partial<Channel>): Promise<void> {
  await setData(`channels.${channelId}`, {
    ...channelData,
    channelId,
  });
}

/**
 * Update channel fields
 */
export async function updateChannel(channelId: string, updates: Partial<Channel>): Promise<void> {
  await updateData(`channels.${channelId}`, updates);
}

/**
 * Delete a channel
 */
export async function deleteChannel(channelId: string): Promise<void> {
  await deleteData(`channels.${channelId}`);
}

// ============================================================================
// Channel Participants Operations
// ============================================================================

export interface Participant {
  address: string;
  [key: string]: any;
}

/**
 * Get channel participants
 */
export async function getChannelParticipants(channelId: string): Promise<Participant[]> {
  const participantsData = await getData<Record<string, Participant>>(
    `channels.${channelId}.participants`
  );
  
  if (!participantsData) return [];
  
  return Object.entries(participantsData).map(([address, participant]) => ({
    ...participant,
    address,
  }));
}

/**
 * Add or update a participant
 */
export async function saveParticipant(
  channelId: string,
  address: string,
  participantData: Partial<Participant>
): Promise<void> {
  await setData(`channels.${channelId}.participants.${address}`, {
    ...participantData,
    address,
  });
}

// ============================================================================
// State Snapshot Operations
// ============================================================================

export interface StateSnapshot {
  snapshotId?: string;
  sequenceNumber?: number;
  merkleRoot?: string;
  stateData?: any;
  _createdAt?: string;
  [key: string]: any;
}

/**
 * Get channel state snapshots
 */
export async function getChannelSnapshots(
  channelId: string,
  limitCount: number = 10
): Promise<StateSnapshot[]> {
  const snapshotsData = await getData<Record<string, StateSnapshot>>(
    `channels.${channelId}.stateSnapshots`
  );
  
  if (!snapshotsData) return [];
  
  const snapshots = Object.entries(snapshotsData).map(([id, snapshot]) => ({
    ...snapshot,
    snapshotId: id,
  }));
  
  // Sort by sequenceNumber descending and limit
  return snapshots
    .sort((a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0))
    .slice(0, limitCount);
}

/**
 * Get latest state snapshot
 */
export async function getLatestSnapshot(channelId: string): Promise<StateSnapshot | null> {
  const snapshots = await getChannelSnapshots(channelId, 1);
  return snapshots.length > 0 ? snapshots[0] : null;
}

/**
 * Save a state snapshot
 */
export async function saveSnapshot(
  channelId: string,
  snapshotData: Omit<StateSnapshot, 'snapshotId' | '_createdAt'>
): Promise<string> {
  return await pushData(`channels.${channelId}.stateSnapshots`, snapshotData);
}

// ============================================================================
// User Balance Operations
// ============================================================================

export interface UserBalance {
  id?: string;
  address: string;
  balance: string;
  [key: string]: any;
}

/**
 * Get user balances for a channel
 */
export async function getChannelUserBalances(channelId: string): Promise<UserBalance[]> {
  const balancesData = await getData<Record<string, UserBalance>>(
    `channels.${channelId}.userBalances`
  );
  
  if (!balancesData) return [];
  
  return Object.entries(balancesData).map(([id, balance]) => ({
    ...balance,
    id,
  }));
}

/**
 * Save or update user balance
 */
export async function saveUserBalance(
  channelId: string,
  address: string,
  balanceData: Partial<UserBalance>
): Promise<void> {
  await setData(`channels.${channelId}.userBalances.${address}`, {
    ...balanceData,
    address,
  });
}

// ============================================================================
// Proof Operations
// ============================================================================

export interface Proof {
  key?: string;
  sequenceNumber?: number;
  proofData?: any;
  status?: 'submitted' | 'verified' | 'rejected';
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any;
}

/**
 * Get proofs by type (submitted, verified, rejected)
 */
export async function getProofs(
  channelId: string,
  type: 'submitted' | 'verified' | 'rejected' = 'submitted'
): Promise<Proof[]> {
  const proofsData = await getData<Record<string, Proof>>(
    `channels.${channelId}.${type}Proofs`
  );
  
  if (!proofsData) return [];
  
  return Object.entries(proofsData).map(([key, proof]) => ({
    ...proof,
    key,
  }));
}

/**
 * Save a proof
 */
export async function saveProof(
  channelId: string,
  type: 'submitted' | 'verified' | 'rejected',
  proofData: Omit<Proof, 'key' | '_createdAt'>
): Promise<string> {
  return await pushData(`channels.${channelId}.${type}Proofs`, proofData);
}

/**
 * Move proof from one type to another (e.g., submitted -> verified)
 */
export async function moveProof(
  channelId: string,
  fromType: 'submitted' | 'verified' | 'rejected',
  toType: 'submitted' | 'verified' | 'rejected',
  proofKey: string
): Promise<void> {
  const proof = await getData<Proof>(`channels.${channelId}.${fromType}Proofs.${proofKey}`);
  
  if (!proof) {
    throw new Error(`Proof not found: ${proofKey}`);
  }
  
  // Save to new location
  await saveProof(channelId, toType, proof);
  
  // Delete from old location
  await deleteData(`channels.${channelId}.${fromType}Proofs.${proofKey}`);
}

/**
 * Get current state number based on verified proofs
 * Returns the next state number (max sequenceNumber + 1)
 * Returns 0 if no verified proofs exist
 */
export async function getCurrentStateNumber(channelId: string): Promise<number> {
  try {
    const verifiedProofs = await getProofs(channelId, 'verified');
    
    if (verifiedProofs.length === 0) {
      return 0;
    }
    
    // Get the highest sequenceNumber
    const maxSequenceNumber = Math.max(
      ...verifiedProofs
        .map(proof => proof.sequenceNumber || 0)
        .filter(num => num !== undefined)
    );
    
    // Next state will be maxSequenceNumber + 1
    return maxSequenceNumber + 1;
  } catch (err) {
    console.warn('Failed to get current state number:', err);
    return 0;
  }
}
