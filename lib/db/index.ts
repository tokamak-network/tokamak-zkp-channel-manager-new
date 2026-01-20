/**
 * Database Module
 * 
 * Centralized database access for the application
 * 
 * Usage:
 *   import { getChannel, saveChannel, getData, setData } from '@/lib/db';
 * 
 * Note: This module is server-side only (Next.js API routes)
 * Do not import in client components
 */

// Export client
export { db, initDb, getDb } from './client';

// Export helpers
export {
  getData,
  setData,
  pushData,
  updateData,
  deleteData,
  exists,
} from './helpers';

// Export channel-specific functions
export {
  getChannel,
  getAllChannels,
  getActiveChannels,
  saveChannel,
  updateChannel,
  deleteChannel,
  getChannelParticipants,
  saveParticipant,
  getChannelSnapshots,
  getLatestSnapshot,
  saveSnapshot,
  getChannelUserBalances,
  saveUserBalance,
  getProofs,
  saveProof,
  moveProof,
  getCurrentStateNumber,
} from './channels';

// Export types
export type {
  Channel,
  Participant,
  StateSnapshot,
  UserBalance,
  Proof,
} from './channels';
