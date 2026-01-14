import { NextRequest, NextResponse } from "next/server";
import { getProofs } from "@/lib/db/channels";

/**
 * GET /api/channels/:id/proofs - Get proofs for a channel
 * 
 * Case-insensitive lookup: Accepts channelId in any case format.
 * The getProofs function handles case normalization internally.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const channelId = resolvedParams.id;
    // getProofs automatically normalizes channelId to lowercase
    console.log('[API] GET /api/channels/:id/proofs - Channel ID:', channelId);
    console.log('[API] GET /api/channels/:id/proofs - Normalized (lowercase):', channelId.toLowerCase());
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "submitted") as
      | "submitted"
      | "verified"
      | "rejected";

    // getProofs handles case normalization internally
    const proofs = await getProofs(channelId, type);

    return NextResponse.json({ 
      success: true,
      data: proofs,
      proofs // Keep for backward compatibility
    });
  } catch (error) {
    console.error("Error fetching proofs:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch proofs" 
      },
      { status: 500 }
    );
  }
}
