import { NextResponse } from 'next/server';
import { getActiveChannels, getAllChannels } from '@/lib/db';

/**
 * GET /api/channels - 채널 목록 조회
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
 * POST /api/channels - 새 채널 생성 (DKG 시작)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, participants, threshold } = body;

    // 유효성 검사
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

    // TODO: 실제 채널 생성 로직
    // - DKG 세션 시작
    // - 컨트랙트 호출
    
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

