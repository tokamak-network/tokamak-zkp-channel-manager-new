import { NextResponse } from 'next/server';

/**
 * GET /api/channels - 채널 목록 조회
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userAddress = searchParams.get('user');

  // TODO: 실제 데이터 조회 로직
  // - 컨트랙트에서 채널 목록 조회
  // - 또는 인덱서 DB에서 조회
  
  const mockChannels = [
    {
      id: '1',
      name: 'Channel #1',
      status: 'active',
      participants: ['0x123...', '0x456...'],
      totalDeposit: '1000000000000000000',
    },
  ];

  return NextResponse.json({
    success: true,
    data: mockChannels,
  });
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

