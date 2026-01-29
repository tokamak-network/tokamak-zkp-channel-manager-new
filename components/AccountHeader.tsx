/**
 * Account Header Component
 *
 * Shows wallet address and network in the top right corner
 * Clickable to open AccountPanel
 *
 * Design:
 * - https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3148-243139
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { formatAddress } from "@/lib/utils/format";
import { AccountPanel } from "./AccountPanel";
import { Home } from "lucide-react";

export function AccountHeader() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chains = [sepolia, mainnet];
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleGoHome = () => {
    router.push("/");
  };

  const networkName = chains.find((c) => c.id === chainId)?.name || "Unknown";

  return (
    <>
      {/* Header with Account Info and Home Button - Top Right (Vertical) */}
      <div className="absolute top-8 right-12 z-30 flex flex-col items-end gap-3">
        {/* Account Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          data-testid="account-header-button"
          className="flex items-center font-mono bg-white hover:bg-[#F8F8F8] transition-colors cursor-pointer"
          style={{
            border: "1px solid #BBBBBB",
            borderRadius: 4,
            padding: "16px 0",
            height: 58,
          }}
        >
          {isConnected && address ? (
            <>
              {/* Network */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 120,
                  padding: "0 24px",
                  borderRight: "1px solid #BBBBBB",
                }}
              >
                <span
                  className="font-medium text-[#111111]"
                  style={{ fontSize: 20, lineHeight: "1.3em" }}
                >
                  {networkName}
                </span>
              </div>
              {/* Address */}
              <div
                className="flex items-center justify-center"
                style={{ padding: "0 24px" }}
              >
                <span
                  className="text-[#111111]"
                  style={{ fontSize: 20, lineHeight: "1.3em" }}
                >
                  {formatAddress(address)}
                </span>
              </div>
            </>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ padding: "0 24px" }}
            >
              <span
                className="text-[#999999]"
                style={{ fontSize: 20, lineHeight: "1.3em" }}
              >
                Not connected
              </span>
            </div>
          )}
        </button>

        {/* Home Button */}
        <button
          onClick={handleGoHome}
          className="flex items-center justify-center gap-2 font-mono bg-white hover:bg-[#F8F8F8] transition-colors cursor-pointer w-full"
          style={{
            border: "1px solid #BBBBBB",
            borderRadius: 4,
            padding: "16px 24px",
            height: 58,
          }}
        >
          <Home size={24} className="text-[#111111]" />
          <span
            className="text-[#111111]"
            style={{ fontSize: 20, lineHeight: "1.3em" }}
          >
            Home
          </span>
        </button>
      </div>

      {/* Sliding Account Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 400 }}
      >
        <div style={{ padding: 20 }}>
          <AccountPanel onClose={() => setIsPanelOpen(false)} />
        </div>
      </div>

      {/* Overlay */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </>
  );
}
