/**
 * App Layout Component
 * 
 * Common layout wrapper with AccountHeader
 */

import { AccountHeader } from './AccountHeader';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Account Header - Top Right */}
      <AccountHeader />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {children}
      </div>
    </div>
  );
}
