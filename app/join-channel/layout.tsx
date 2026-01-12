/**
 * Join Channel Layout
 * 
 * Layout with AppLayout for join channel page
 */

import { AppLayout } from "@/components/AppLayout";

export default function JoinChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
