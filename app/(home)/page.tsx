/**
 * Home Page
 * 
 * Main landing page
 */

import { AccountPanel } from '@/components/AccountPanel';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header Section with Account Panel */}
      <div className="mb-12 flex items-start justify-between gap-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-3 text-[var(--foreground)]">
            Tokamak ZKP Channel Manager
          </h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            Manage your zero-knowledge proof channels
          </p>
        </div>
        {/* Account Panel - Right Side */}
        <div className="flex-shrink-0">
          <AccountPanel />
        </div>
      </div>

      {/* Home Screen Placeholder */}
      <div className="text-center py-16">
        <p className="text-xl text-[var(--muted-foreground)]">
          홈 화면
        </p>
      </div>
    </main>
  );
}

