/**
 * Account Header Component
 * 
 * Shows wallet address and network in the top right corner
 * Clickable to open AccountPanel
 */

"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { formatAddress } from "@/lib/utils/format";
import { AccountPanel } from "./AccountPanel";

export function AccountHeader() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chains = [sepolia, mainnet];
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Header with Account Info - Clickable */}
      <div className="absolute top-8 right-8 z-30">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all cursor-pointer"
        >
          {isConnected && address ? (
            <>
              <div className="text-right">
                <p className="text-xs text-gray-500">Connected</p>
                <p className="font-mono text-sm">{formatAddress(address)}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Network</p>
                <p className="text-sm font-semibold">
                  {chains.find((c) => c.id === chainId)?.name || `Chain ${chainId}`}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </button>
      </div>

      {/* Sliding Account Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Account Details</h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <AccountPanel />
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
