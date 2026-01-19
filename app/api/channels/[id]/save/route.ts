import { NextResponse } from "next/server";
import { saveChannel } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/channels/:id/save - Save channel information after creation
 * 
 * Saves channel information to the database based on transaction receipt.
 * 
 * Storage normalization: Channel ID is automatically normalized to lowercase
 * before saving. This ensures consistent storage regardless of input case.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    // saveChannel automatically normalizes channelId to lowercase
    console.log('[API] POST /api/channels/:id/save - Channel ID:', id);
    console.log('[API] POST /api/channels/:id/save - Will be normalized to:', id.toLowerCase());
    const body = await request.json();

    const {
      txHash,
      targetContract,
      participants,
      blockNumber,
      blockTimestamp,
      appType,
    } = body;

    // Validation
    if (!txHash || !targetContract || !participants) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: txHash, targetContract, participants",
        },
        { status: 400 }
      );
    }

    // Save channel information
    await saveChannel(id, {
      channelId: id,
      status: "pending", // Pending until initialization
      targetContract,
      participants: Array.isArray(participants) ? participants : [participants],
      openChannelTxHash: txHash,
      blockNumber: blockNumber?.toString(),
      blockTimestamp: blockTimestamp?.toString(),
      createdAt: Date.now(), // Unix timestamp (milliseconds) - avoids timezone issues
      appType: appType || null, // App type for future extensibility (e.g., "ERC20", "NFT", etc.)
    });

    return NextResponse.json({
      success: true,
      data: {
        channelId: id,
        message: "Channel information saved successfully",
      },
    });
  } catch (error) {
    console.error("Error saving channel:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save channel",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
