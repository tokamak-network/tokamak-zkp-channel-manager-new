/**
 * Initialize State Layout
 */

import { AppLayout } from "@/components/AppLayout";

export default function InitializeStateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
