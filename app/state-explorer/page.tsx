/**
 * State Explorer Root Page
 *
 * Redirects to appropriate page based on channel state
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";

export default function StateExplorerPage() {
  const router = useRouter();
  const { currentChannelId } = useChannelFlowStore();

  useEffect(() => {
    if (!currentChannelId) {
      router.replace("/join-channel");
    } else {
      // Default to deposit page
      router.replace("/state-explorer/deposit");
    }
  }, [currentChannelId, router]);

  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
