'use client';

import { ChannelCard } from './ChannelCard';

/**
 * ChannelList - 채널 목록 컴포넌트
 * 
 * TODO: 실제 구현 시
 * - useChannels 훅으로 데이터 페칭
 * - 페이지네이션
 * - 빈 상태 처리
 */

// Mock data - TODO: 실제 데이터로 교체
const mockChannels = [
  {
    id: '1',
    name: 'Channel #1',
    status: 'active' as const,
    participants: 3,
    balance: '1000',
  },
  {
    id: '2',
    name: 'Channel #2',
    status: 'pending' as const,
    participants: 5,
    balance: '2500',
  },
  {
    id: '3',
    name: 'Channel #3',
    status: 'closed' as const,
    participants: 2,
    balance: '0',
  },
];

export function ChannelList() {
  // TODO: const { channels, isLoading, error } = useChannels();

  return (
    <div className="space-y-4">
      {mockChannels.map((channel) => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}

