import { NextResponse } from 'next/server';
import { getChannel, updateChannel } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/channels/:id - Get specific channel
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Decode URL-encoded channel ID if needed
    const channelId = decodeURIComponent(id);
    console.log('[API] GET /api/channels/:id - Raw ID:', id);
    console.log('[API] GET /api/channels/:id - Decoded Channel ID:', channelId);

    const channel = await getChannel(channelId);
    console.log('[API] Channel found:', channel ? 'Yes' : 'No');
    if (channel) {
      console.log('[API] Channel data:', {
        channelId: channel.channelId,
        initializationTxHash: channel.initializationTxHash,
        status: channel.status,
      });
    }

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Channel not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch channel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/channels/:id - Update channel status
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Decode URL-encoded channel ID if needed
    const channelId = decodeURIComponent(id);
    const body = await request.json();

    // Check if channel exists
    const existingChannel = await getChannel(channelId);
    if (!existingChannel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Channel not found',
        },
        { status: 404 }
      );
    }

    // Update channel
    await updateChannel(channelId, body);

    // Return updated channel
    const updatedChannel = await getChannel(channelId);

    return NextResponse.json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update channel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

