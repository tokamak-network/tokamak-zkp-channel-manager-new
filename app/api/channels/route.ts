import { NextResponse } from 'next/server';
import { getActiveChannels, getAllChannels } from '@/lib/db';

/**
 * GET /api/channels - Get channel list
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userAddress = searchParams.get('user');

    // Get channels from database
    let channels;
    if (status === 'active') {
      channels = await getActiveChannels();
    } else {
      channels = await getAllChannels();
    }

    // Filter by user address if provided
    if (userAddress) {
      channels = channels.filter(channel =>
        channel.participants?.some(
          (p: string) => p.toLowerCase() === userAddress.toLowerCase()
        )
      );
    }

    return NextResponse.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch channels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels - Create new channel (DKG start)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, participants, threshold } = body;

    // Validation
    if (!name || !participants || !threshold) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (participants.length < threshold) {
      return NextResponse.json(
        { success: false, error: 'Threshold cannot exceed participant count' },
        { status: 400 }
      );
    }

    // TODO: Implement actual channel creation logic
    // - Start DKG session
    // - Call contract
    
    return NextResponse.json({
      success: true,
      data: {
        channelId: 'new-channel-id',
        dkgSessionId: 'new-dkg-session-id',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}

