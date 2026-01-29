/**
 * Channel State Management for E2E Testing
 *
 * Manages channel state between test steps via artifacts.
 * Each job saves/loads state from JSON files.
 */

import * as fs from "fs";
import * as path from "path";

export interface ChannelTestState {
  channelId: string | null;
  leaderAddress: string;
  participantAddress: string;
  createdAt: number;
  depositedAt?: number;
  initializedAt?: number;
  transactionAt?: number;
  proofSubmittedAt?: number;
  closedAt?: number;
  withdrawnAt?: number;
  // Additional metadata
  txHashes: {
    create?: string;
    leaderDeposit?: string;
    participantDeposit?: string;
    initialize?: string;
    transaction?: string;
    submitProof?: string;
    close?: string;
    leaderWithdraw?: string;
    participantWithdraw?: string;
  };
}

const STATE_FILE = "channel-test-state.json";

/**
 * Gets the path to the state file
 */
function getStatePath(): string {
  // In CI, use the workspace directory
  // Locally, use the project root
  const baseDir = process.env.GITHUB_WORKSPACE || process.cwd();
  return path.join(baseDir, STATE_FILE);
}

/**
 * Saves the channel test state to a file
 */
export function saveChannelState(state: ChannelTestState): void {
  const statePath = getStatePath();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(`[ChannelState] Saved state to ${statePath}`);
}

/**
 * Loads the channel test state from a file
 */
export function loadChannelState(): ChannelTestState | null {
  const statePath = getStatePath();

  if (!fs.existsSync(statePath)) {
    console.log(`[ChannelState] No state file found at ${statePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(statePath, "utf-8");
    const state = JSON.parse(content) as ChannelTestState;
    console.log(`[ChannelState] Loaded state from ${statePath}:`, state);
    return state;
  } catch (error) {
    console.error(`[ChannelState] Failed to load state:`, error);
    return null;
  }
}

/**
 * Updates the channel test state
 */
export function updateChannelState(
  updates: Partial<ChannelTestState>
): ChannelTestState {
  const currentState = loadChannelState();

  if (!currentState) {
    throw new Error("No existing channel state found");
  }

  const newState: ChannelTestState = {
    ...currentState,
    ...updates,
    txHashes: {
      ...currentState.txHashes,
      ...updates.txHashes,
    },
  };

  saveChannelState(newState);
  return newState;
}

/**
 * Creates initial channel state
 */
export function createInitialState(
  leaderAddress: string,
  participantAddress: string
): ChannelTestState {
  const state: ChannelTestState = {
    channelId: null,
    leaderAddress,
    participantAddress,
    createdAt: Date.now(),
    txHashes: {},
  };

  saveChannelState(state);
  return state;
}

/**
 * Clears the channel state file
 */
export function clearChannelState(): void {
  const statePath = getStatePath();

  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
    console.log(`[ChannelState] Cleared state file at ${statePath}`);
  }
}
