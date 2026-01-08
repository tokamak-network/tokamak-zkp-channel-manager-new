import { Suspense } from 'react';
import { ChannelList } from './_components/ChannelList';
import { ChannelFilter } from './_components/ChannelFilter';
import { ChannelStats } from './_components/ChannelStats';

export const metadata = {
  title: 'Channels',
  description: '채널 목록 조회 및 관리',
};

export default function ChannelsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Channels</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          생성된 채널을 조회하고 관리합니다.
        </p>
      </div>

      {/* 통계 */}
      <ChannelStats />

      {/* 필터 */}
      <ChannelFilter />

      {/* 채널 목록 */}
      <Suspense fallback={<ChannelListSkeleton />}>
        <ChannelList />
      </Suspense>
    </main>
  );
}

function ChannelListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-[var(--muted)]"
        />
      ))}
    </div>
  );
}

