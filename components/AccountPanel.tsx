/**
 * Account Panel Component
 *
 * Displays wallet connection status and account information
 */

"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSignMessage,
} from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { Button, Input, Label } from "@tokamak/ui";
import { Card, CardContent, CardHeader } from "@tokamak/ui";
import { formatAddress, formatBalance } from "@/lib/utils/format";
import { isValidBytes32 } from "@/lib/channelId";
import { useGenerateMptKey } from "@/hooks/useGenerateMptKey";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Copy Address Button Component
 */
function CopyAddressButton({
  address,
}: {
  address: `0x${string}` | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
      title={copied ? "Copied!" : "Copy address"}
    >
      {copied ? (
        <svg
          className="w-4 h-4 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

export function AccountPanel() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const chains = [sepolia, mainnet];
  const { data: balance } = useBalance({
    address,
  });

  // L2 Address calculation state
  const [channelId, setChannelId] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedMptKey, setCopiedMptKey] = useState(false);

  // Use common hook for L2 address and MPT key generation
  const {
    generate,
    isGenerating: isComputing,
    error: l2Error,
    accountInfo,
  } = useGenerateMptKey({
    channelId: channelId || null,
    slotIndex: 0,
  });

  const l2Address = accountInfo?.l2Address || null;
  const l2MptKey = accountInfo?.mptKey || null;

  const handleConnect = () => {
    // Try to connect with injected connector first
    const injected = connectors.find((c) => c.id === "injected");
    if (injected) {
      connect({ connector: injected });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const computeL2Address = async () => {
    if (!channelId || channelId.trim() === "") {
      return;
    }

    if (!isValidBytes32(channelId)) {
      return;
    }

    await generate();
  };

  const handleCopyL2Address = async () => {
    if (!l2Address) return;

    try {
      await navigator.clipboard.writeText(l2Address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy L2 address:", err);
    }
  };

  const handleCopyMptKey = async () => {
    if (!l2MptKey) return;

    try {
      await navigator.clipboard.writeText(l2MptKey);
      setCopiedMptKey(true);
      setTimeout(() => setCopiedMptKey(false), 2000);
    } catch (err) {
      console.error("Failed to copy MPT key:", err);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-80">
        <CardHeader>
          <h3 className="text-lg font-semibold">Wallet</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Connect your wallet to get started
          </p>
          <Button
            onClick={handleConnect}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Connecting..." : "Connect Wallet"}
          </Button>
          <div className="text-xs text-[var(--muted-foreground)] space-y-1">
            <p>Available connectors:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {connectors.map((connector) => (
                <li key={connector.id}>{connector.name}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Account</h3>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[var(--muted-foreground)]">Address</p>
            <CopyAddressButton address={address} />
          </div>
          <p className="font-mono text-sm break-all">
            {formatAddress(address)}
          </p>
        </div>

        {/* Balance */}
        {balance && (
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">
              Balance
            </p>
            <p className="text-sm font-semibold">
              {formatBalance(balance.value, balance.decimals)} {balance.symbol}
            </p>
          </div>
        )}

        {/* Chain */}
        <div>
          <p className="text-xs text-[var(--muted-foreground)] mb-1">Network</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">
              {chains.find((c) => c.id === chainId)?.name || `Chain ${chainId}`}
            </p>
          </div>
        </div>

        {/* L2 Address Calculator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1">
                L2 Address Calculator
              </Label>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                Enter channel ID to calculate your L2 address
              </p>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="0x..."
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value);
                }}
                className="font-mono text-sm"
              />
              <Button
                onClick={computeL2Address}
                disabled={
                  isComputing || !channelId || !isValidBytes32(channelId)
                }
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Computing...
                  </>
                ) : (
                  "Calculate L2 Address"
                )}
              </Button>
            </div>

            {/* Error Message */}
            {l2Error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{l2Error}</span>
              </div>
            )}

            {/* L2 Address Result */}
            {l2Address && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      L2 Address
                    </p>
                    <button
                      onClick={handleCopyL2Address}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={copied ? "Copied!" : "Copy L2 address"}
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs break-all">{l2Address}</p>
                </div>

                {l2MptKey && (
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        MPT Key
                      </p>
                      <button
                        onClick={handleCopyMptKey}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={copiedMptKey ? "Copied!" : "Copy MPT key"}
                      >
                        {copiedMptKey ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-xs break-all">{l2MptKey}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
