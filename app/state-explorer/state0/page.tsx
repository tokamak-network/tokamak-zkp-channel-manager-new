/**
 * State0 Component
 *
 * Shows when channel state is 0 (None) and no withdrawable amount exists.
 * This means the channel ID is invalid or the channel has been deleted.
 */

"use client";

import { Button, Card, CardContent } from "@tokamak/ui";
import { useRouter } from "next/navigation";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";

export function State0Page() {
  const router = useRouter();
  const { clearCurrentChannelId } = useChannelFlowStore();

  const handleGoToJoinChannel = () => {
    clearCurrentChannelId();
    router.push("/join-channel");
  };

  const handleGoToCreateChannel = () => {
    clearCurrentChannelId();
    router.push("/create-channel");
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-6 pt-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            Channel Not Found
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            This channel ID does not exist or has been deleted.
            <br />
            The channel may have been closed and cleaned up.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleGoToJoinChannel} className="w-full">
            Join Another Channel
          </Button>
          <Button
            onClick={handleGoToCreateChannel}
            variant="outline"
            className="w-full"
          >
            Create New Channel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
