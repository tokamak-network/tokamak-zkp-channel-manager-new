/**
 * Create Channel Layout
 * 
 * Layout with AppLayout for create channel page
 */

import { AppLayout } from "@/components/AppLayout";

export default function CreateChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
