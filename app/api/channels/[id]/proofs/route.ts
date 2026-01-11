import { NextRequest, NextResponse } from "next/server";
import { getProofs } from "@/lib/db/channels";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const channelId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "submitted") as
      | "submitted"
      | "verified"
      | "rejected";

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
