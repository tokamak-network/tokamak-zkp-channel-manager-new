/**
 * App Layout Component
 * 
 * Common layout wrapper with Sidebar, Header, and AccountPanel
 */

import { Sidebar } from './Sidebar';
import { AccountPanel } from './AccountPanel';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1">
          {/* Header Section with Account Panel */}
          <header className="mb-12 flex items-start justify-between gap-8">
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
          </header>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}

