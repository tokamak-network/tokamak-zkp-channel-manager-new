/**
 * HeroSection - 메인 페이지 히어로 섹션
 * 
 * TODO: 실제 디자인 적용 시
 * - 배경 그래디언트/패턴
 * - 애니메이션 효과
 * - 지갑 연결 버튼
 */
export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Tokamak ZKP Channel Manager
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-[var(--muted-foreground)]">
        Zero-Knowledge Proof 기반 State Channel 관리 시스템
      </p>
      <div className="mt-10 flex gap-4">
        {/* TODO: 지갑 연결 버튼 */}
        <button className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700">
          Connect Wallet
        </button>
        <button className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium hover:bg-[var(--muted)]">
          Learn More
        </button>
      </div>
    </section>
  );
}

