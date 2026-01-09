/**
 * Save Channel Utility
 * 
 * Utility function for saving channel information to database after creation
 */

interface SaveChannelParams {
  channelId: string;
  txHash: string;
  targetContract: string;
  participants: string[];
  blockNumber: string;
  blockTimestamp?: string;
}

/**
 * Save channel information to database
 * 
 * @param params - Channel information to save
 * @returns Promise that resolves when channel is saved
 */
export async function saveChannelToDatabase(
  params: SaveChannelParams
): Promise<void> {
  const { channelId, txHash, targetContract, participants, blockNumber, blockTimestamp } = params;

  const response = await fetch(`/api/channels/${channelId}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      txHash,
      targetContract,
      participants,
      blockNumber,
      blockTimestamp,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to save channel to database:", errorData);
    // Don't throw - channel is created on-chain, DB save is secondary
    throw new Error(errorData.error || "Failed to save channel to database");
  }

  console.log("Channel information saved to database:", channelId);
}
