/**
 * State0 Component
 *
 * Shows when channel state is 0 (None) and no withdrawable amount exists.
 * This means the user has no withdrawable balance in this channel.
 */

"use client";

import { useRouter } from "next/navigation";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { Home } from "lucide-react";

export function State0Page() {
  const router = useRouter();
  const { clearCurrentChannelId } = useChannelFlowStore();

  const handleGoToHome = () => {
    clearCurrentChannelId();
    router.push("/");
  };

  return (
    <div className="font-mono" style={{ width: 544 }}>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-medium text-[#111111]"
          style={{ fontSize: 32, lineHeight: "1.3em" }}
        >
          No Withdrawable Balance
        </h2>

        {/* Description */}
        <div
          className="flex flex-col gap-3"
          style={{
            padding: "24px",
            borderRadius: 4,
            border: "1px solid #DDDDDD",
            backgroundColor: "#F9F9F9",
          }}
        >
          <p
            className="text-[#666666]"
            style={{ fontSize: 16, lineHeight: "1.5em" }}
          >
            There is no withdrawable amount for your account in this channel.
          </p>
          <p
            className="text-[#666666]"
            style={{ fontSize: 16, lineHeight: "1.5em" }}
          >
            The channel may have been closed, or you may not have participated in this channel.
          </p>
        </div>

        {/* Go to Home Button */}
        <button
          onClick={handleGoToHome}
          className="flex items-center justify-center gap-2 font-mono font-medium transition-colors"
          style={{
            height: 40,
            padding: "16px 24px",
            borderRadius: 4,
            border: "1px solid #111111",
            backgroundColor: "#2A72E5",
            color: "#FFFFFF",
            fontSize: 18,
          }}
        >
          <Home className="w-5 h-5" />
          Go to Home
        </button>
      </div>
    </div>
  );
}
