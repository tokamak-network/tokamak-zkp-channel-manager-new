import { NextRequest, NextResponse } from "next/server";
import { getChannelSnapshots } from "@/lib/db/channels";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const channelId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const snapshots = await getChannelSnapshots(channelId, limit);

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }
}
