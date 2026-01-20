/**
 * FeatureGrid - 주요 기능 그리드
 * 
 * TODO: 실제 구현 시
 * - 아이콘 추가
 * - 링크 연결
 * - 호버 효과
 */

const features = [
  {
    title: 'Create Channel',
    description: 'DKG를 통한 새로운 채널 생성',
    href: '/channels/create',
  },
  {
    title: 'Manage Channels',
    description: '기존 채널 조회 및 관리',
    href: '/channels',
  },
  {
    title: 'Submit Proof',
    description: 'ZK Proof 제출 및 상태 업데이트',
    href: '/proof/submit',
  },
  {
    title: 'Withdraw',
    description: '토큰 출금 및 채널 종료',
    href: '/withdraw',
  },
];

export function FeatureGrid() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-2xl font-semibold">Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-[var(--border)] p-6 transition-colors hover:bg-[var(--muted)]"
    >
      {/* TODO: Icon */}
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
    </a>
  );
}

