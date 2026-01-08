import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/channels/:id - 특정 채널 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // TODO: 실제 채널 조회 로직
  
  return NextResponse.json({
    success: true,
    data: {
      id,
      name: `Channel #${id}`,
      status: 'active',
      participants: [],
      totalDeposit: '0',
    },
  });
}

/**
 * PATCH /api/channels/:id - 채널 상태 업데이트
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  // TODO: 실제 업데이트 로직
  
  return NextResponse.json({
    success: true,
    data: { id, ...body },
  });
}

