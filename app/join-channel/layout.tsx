/**
 * Join Channel Layout
 *
 * Layout for join channel page with AccountHeader and Home button
 * Uses full screen centered design (no container wrapper)
 */

import { AccountHeader } from "@/components/AccountHeader";

export default function JoinChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Account Header - Top Right + Floating Home Button */}
      <AccountHeader />

      {/* Main Content - Full screen without container */}
      {children}
    </div>
  );
}
