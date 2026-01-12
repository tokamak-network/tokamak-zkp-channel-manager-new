/**
 * State Explorer Layout
 */

import { AppLayout } from "@/components/AppLayout";

export default function StateExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
