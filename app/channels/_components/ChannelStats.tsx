/**
 * ChannelStats - 채널 통계 컴포넌트
 * 
 * TODO: 실제 구현 시
 * - 실제 데이터 연동
 * - 로딩 상태
 */

const stats = [
  { label: 'Total Channels', value: '12' },
  { label: 'Active', value: '8' },
  { label: 'Total Locked', value: '45,000 TON' },
];

export function ChannelStats() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-[var(--border)] p-4"
        >
          <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

