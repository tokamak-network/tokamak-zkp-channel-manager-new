/**
 * Client-side Database Helper Functions
 * 
 * Uses the /api/db endpoint to interact with the local database.
 * This can be used in both client and server components.
 * 
 * IMPORTANT: This is the client-side interface. Do not import server-side
 * functions from @/lib/db in client components. Use this module instead.
 */

const API_BASE = "/api/db";

/**
 * Get data from a path
 */
export async function getData<T = any>(path: string): Promise<T | null> {
  try {
    const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("db-client getData: Response not ok", response.status, response.statusText);
      throw new Error(`Failed to get data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data ?? null;
  } catch (error) {
    console.error("getData error:", error);
    return null;
  }
}

/**
 * Set data at a path (replaces existing data)
 */
export async function setData(path: string, data: any): Promise<void> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, data, operation: "set" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set data: ${response.statusText}`);
  }
}

/**
 * Update data at a path (merges with existing data)
 */
export async function updateData(path: string, data: any): Promise<void> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, data, operation: "update" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update data: ${response.statusText}`);
  }
}

/**
 * Push data with auto-generated key
 */
export async function pushData(path: string, data: any): Promise<string> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, data, operation: "push" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to push data: ${response.statusText}`);
  }

  const result = await response.json();
  return result.key || "";
}

/**
 * Delete data at a path
 */
export async function deleteData(path: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}?path=${encodeURIComponent(path)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete data: ${response.statusText}`);
  }
}

// ============================================================================
// Convenience Functions (matching server-side lib/db interface)
// ============================================================================

/**
 * Get channel by ID
 * Note: Uses dot notation for path (channels.${channelId})
 */
export async function getChannel(channelId: string): Promise<any | null> {
  const channel = await getData(`channels.${channelId}`);
  if (!channel) return null;
  
  return {
    ...channel,
    channelId,
  };
}

/**
 * Get channel participants
 * Note: Uses dot notation for path (channels.${channelId}.participants)
 */
export async function getChannelParticipants(channelId: string): Promise<any[]> {
  const participantsData = await getData<Record<string, any>>(
    `channels.${channelId}.participants`
  );

  if (!participantsData) return [];

  return Object.entries(participantsData).map(([address, participant]) => ({
    ...participant,
    address,
  }));
}

/**
 * Get latest snapshot for a channel
 * Note: Uses dot notation for path (channels.${channelId}.stateSnapshots)
 */
export async function getLatestSnapshot(channelId: string): Promise<any | null> {
  const snapshotsData = await getData<Record<string, any>>(
    `channels.${channelId}.stateSnapshots`
  );

  if (!snapshotsData) return null;

  const snapshots = Object.entries(snapshotsData)
    .map(([key, snapshot]) => ({ ...snapshot, snapshotId: key }))
    .sort((a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0));

  return snapshots[0] || null;
}

/**
 * Get user balances for a channel
 * Note: Uses dot notation for path (channels.${channelId}.userBalances)
 */
export async function getChannelUserBalances(channelId: string): Promise<any[]> {
  const balancesData = await getData<Record<string, any>>(
    `channels.${channelId}.userBalances`
  );

  if (!balancesData) return [];

  return Object.entries(balancesData).map(([id, balance]) => ({
    ...balance,
    id,
  }));
}

/**
 * Get current state number based on verified proofs
 * Note: Uses dot notation for path (channels.${channelId}.verifiedProofs)
 */
export async function getCurrentStateNumber(channelId: string): Promise<number> {
  try {
    const verifiedProofsData = await getData<any>(
      `channels.${channelId}.verifiedProofs`
    );

    if (!verifiedProofsData) {
      return 0;
    }

    const verifiedProofsArray = Object.entries(verifiedProofsData)
      .map(([key, value]: [string, any]) => ({ key, ...value }))
      .filter((proof: any) => proof.sequenceNumber !== undefined);

    if (verifiedProofsArray.length === 0) {
      return 0;
    }

    const maxSequenceNumber = Math.max(
      ...verifiedProofsArray.map((proof: any) => proof.sequenceNumber || 0)
    );

    return maxSequenceNumber + 1;
  } catch (err) {
    console.warn("Failed to get current state number:", err);
    return 0;
  }
}
