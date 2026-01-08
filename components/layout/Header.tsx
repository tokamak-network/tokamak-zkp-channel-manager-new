import Link from 'next/link';

/**
 * Header - 공통 헤더 컴포넌트
 * 
 * TODO: 실제 구현 시
 * - 지갑 연결 버튼
 * - 네트워크 선택
 * - 모바일 메뉴
 */

const navItems = [
  { label: 'Channels', href: '/channels' },
  { label: 'Create', href: '/channels/create' },
  { label: 'Proof', href: '/proof' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Tokamak ZKP
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Button */}
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          Connect Wallet
        </button>
      </div>
    </header>
  );
}

