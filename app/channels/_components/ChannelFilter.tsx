'use client';

/**
 * ChannelFilter - 채널 필터 컴포넌트
 * 
 * TODO: 실제 구현 시
 * - URL 쿼리 파라미터와 연동
 * - 상태 필터
 * - 검색
 */
export function ChannelFilter() {
  return (
    <div className="mb-6 flex flex-wrap gap-4">
      {/* 검색 */}
      <input
        type="text"
        placeholder="Search channels..."
        className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      
      {/* 상태 필터 */}
      <select className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  );
}

