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
 * Normalizes channel ID to lowercase for consistent lookup
 * (Ethereum addresses/hashes are case-insensitive)
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  // Normalize channel ID to lowercase for consistent lookup
  const normalizedId = channelId.toLowerCase();
  
  // Try exact match first (normalized)
  let channel = await getData<Channel>(`channels.${normalizedId}`);
  
  // If not found, try case-insensitive search through channels object
  if (!channel) {
    const channelsData = await getData<Record<string, Channel>>('channels');
    if (channelsData) {
      // Find channel with case-insensitive match
      const foundKey = Object.keys(channelsData).find(
        (key) => key.toLowerCase() === normalizedId
      );
      if (foundKey) {
        channel = channelsData[foundKey];
      }
    }
  }
  
  if (!channel) return null;
  
  return {
    ...channel,
    channelId: channel.channelId || normalizedId,
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
 * Normalizes channel ID to lowercase for consistent storage
 * (Ethereum addresses/hashes are case-insensitive)
 */
export async function saveChannel(channelId: string, channelData: Partial<Channel>): Promise<void> {
  // Normalize channel ID to lowercase for consistent storage
  const normalizedId = channelId.toLowerCase();
  
  await setData(`channels.${normalizedId}`, {
    ...channelData,
    channelId: normalizedId, // Store normalized ID in channel data as well
  });
}

/**
 * Update channel fields
 * Normalizes channel ID to lowercase for consistent storage
 * (Ethereum addresses/hashes are case-insensitive)
 */
export async function updateChannel(channelId: string, updates: Partial<Channel>): Promise<void> {
  // Normalize channel ID to lowercase for consistent storage
  const normalizedId = channelId.toLowerCase();
  
  // If channelId is being updated, normalize it too
  const normalizedUpdates = {
    ...updates,
    ...(updates.channelId && { channelId: updates.channelId.toLowerCase() }),
  };
  
  await updateData(`channels.${normalizedId}`, normalizedUpdates);
}

/**
 * Delete a channel
 */
/**
 * Delete a channel
 * Normalizes channel ID to lowercase for consistent lookup
 * (Ethereum addresses/hashes are case-insensitive)
 */
export async function deleteChannel(channelId: string): Promise<void> {
  // Normalize channel ID to lowercase for consistent lookup
  const normalizedId = channelId.toLowerCase();
  
  await deleteData(`channels.${normalizedId}`);
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
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function getChannelParticipants(channelId: string): Promise<Participant[]> {
  const normalizedId = channelId.toLowerCase();
  const participantsData = await getData<Record<string, Participant>>(
    `channels.${normalizedId}.participants`
  );
  
  if (!participantsData) return [];
  
  return Object.entries(participantsData).map(([address, participant]) => ({
    ...participant,
    address,
  }));
}

/**
 * Add or update a participant
 * Normalizes channel ID to lowercase for consistent storage
 */
export async function saveParticipant(
  channelId: string,
  address: string,
  participantData: Partial<Participant>
): Promise<void> {
  const normalizedId = channelId.toLowerCase();
  await setData(`channels.${normalizedId}.participants.${address}`, {
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
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function getChannelSnapshots(
  channelId: string,
  limitCount: number = 10
): Promise<StateSnapshot[]> {
  const normalizedId = channelId.toLowerCase();
  const snapshotsData = await getData<Record<string, StateSnapshot>>(
    `channels.${normalizedId}.stateSnapshots`
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
 * Normalizes channel ID to lowercase for consistent storage
 */
export async function saveSnapshot(
  channelId: string,
  snapshotData: Omit<StateSnapshot, 'snapshotId' | '_createdAt'>
): Promise<string> {
  const normalizedId = channelId.toLowerCase();
  return await pushData(`channels.${normalizedId}.stateSnapshots`, snapshotData);
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
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function getChannelUserBalances(channelId: string): Promise<UserBalance[]> {
  const normalizedId = channelId.toLowerCase();
  const balancesData = await getData<Record<string, UserBalance>>(
    `channels.${normalizedId}.userBalances`
  );
  
  if (!balancesData) return [];
  
  return Object.entries(balancesData).map(([id, balance]) => ({
    ...balance,
    id,
  }));
}

/**
 * Save or update user balance
 * Normalizes channel ID to lowercase for consistent storage
 */
export async function saveUserBalance(
  channelId: string,
  address: string,
  balanceData: Partial<UserBalance>
): Promise<void> {
  const normalizedId = channelId.toLowerCase();
  await setData(`channels.${normalizedId}.userBalances.${address}`, {
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
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function getProofs(
  channelId: string,
  type: 'submitted' | 'verified' | 'rejected' = 'submitted'
): Promise<Proof[]> {
  const normalizedId = channelId.toLowerCase();
  const proofsData = await getData<Record<string, Proof>>(
    `channels.${normalizedId}.${type}Proofs`
  );
  
  if (!proofsData) return [];
  
  return Object.entries(proofsData).map(([key, proof]) => ({
    ...proof,
    key,
  }));
}

/**
 * Save a proof
 * Normalizes channel ID to lowercase for consistent storage
 */
export async function saveProof(
  channelId: string,
  type: 'submitted' | 'verified' | 'rejected',
  proofData: Omit<Proof, 'key' | '_createdAt'>
): Promise<string> {
  const normalizedId = channelId.toLowerCase();
  return await pushData(`channels.${normalizedId}.${type}Proofs`, proofData);
}

/**
 * Move proof from one type to another (e.g., submitted -> verified)
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function moveProof(
  channelId: string,
  fromType: 'submitted' | 'verified' | 'rejected',
  toType: 'submitted' | 'verified' | 'rejected',
  proofKey: string
): Promise<void> {
  const normalizedId = channelId.toLowerCase();
  const proof = await getData<Proof>(`channels.${normalizedId}.${fromType}Proofs.${proofKey}`);
  
  if (!proof) {
    throw new Error(`Proof not found: ${proofKey}`);
  }
  
  // Save to new location
  await saveProof(normalizedId, toType, proof);
  
  // Delete from old location
  await deleteData(`channels.${normalizedId}.${fromType}Proofs.${proofKey}`);
}

/**
 * Delete a proof
 * Normalizes channel ID to lowercase for consistent lookup
 */
export async function deleteProof(
  channelId: string,
  type: 'submitted' | 'verified' | 'rejected',
  proofKey: string
): Promise<void> {
  const normalizedId = channelId.toLowerCase();
  await deleteData(`channels.${normalizedId}.${type}Proofs.${proofKey}`);
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
