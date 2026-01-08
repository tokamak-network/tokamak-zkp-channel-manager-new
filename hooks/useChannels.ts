'use client';

import { useState, useEffect } from 'react';
import type { Channel } from '@/types';

/**
 * useChannels - 채널 목록 조회 훅
 * 
 * TODO: 실제 구현 시
 * - API 또는 컨트랙트에서 데이터 페칭
 * - React Query 또는 SWR 사용
 * - 캐싱 및 리페칭 전략
 */

interface UseChannelsOptions {
  status?: string;
  userAddress?: string;
}

interface UseChannelsReturn {
  channels: Channel[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useChannels(options?: UseChannelsOptions): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: 실제 API 호출
      // const response = await fetch('/api/channels');
      // const data = await response.json();
      // setChannels(data);
      
      // Mock delay
      await new Promise((r) => setTimeout(r, 500));
      setChannels([]);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch channels'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [options?.status, options?.userAddress]);

  return {
    channels,
    isLoading,
    error,
    refetch: fetchChannels,
  };
}

