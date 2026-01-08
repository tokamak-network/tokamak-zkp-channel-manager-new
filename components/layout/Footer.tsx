/**
 * Footer - 공통 푸터 컴포넌트
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--muted-foreground)]">
        <p>© 2025 Tokamak Network. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6">
          <a href="#" className="hover:text-[var(--foreground)]">Docs</a>
          <a href="#" className="hover:text-[var(--foreground)]">GitHub</a>
          <a href="#" className="hover:text-[var(--foreground)]">Discord</a>
        </div>
      </div>
    </footer>
  );
}

