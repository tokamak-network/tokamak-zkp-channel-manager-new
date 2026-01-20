/**
 * QuickActions - 빠른 액션 섹션
 * 
 * TODO: 실제 구현 시
 * - 지갑 연결 상태에 따른 조건부 렌더링
 * - 최근 활동 표시
 */
export function QuickActions() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-2xl font-semibold">Quick Actions</h2>
        <div className="rounded-xl border border-[var(--border)] p-8">
          <p className="text-[var(--muted-foreground)]">
            지갑을 연결하면 빠른 액션을 사용할 수 있습니다.
          </p>
          {/* TODO: 연결 후 표시될 액션들 */}
        </div>
      </div>
    </section>
  );
}

