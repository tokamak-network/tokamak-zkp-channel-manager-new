/**
 * Account Panel Component
 * 
 * Displays wallet connection status and account information
 */

'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { Button } from '@tokamak/ui';
import { Card, CardContent, CardHeader } from '@tokamak/ui';
import { formatAddress, formatBalance } from '@/lib/utils/format';

/**
 * Copy Address Button Component
 */
function CopyAddressButton({ address }: { address: `0x${string}` | undefined }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
      title={copied ? 'Copied!' : 'Copy address'}
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
  const chainId = useChainId();
  const chains = [sepolia, mainnet];
  const { data: balance } = useBalance({
    address,
  });

  const handleConnect = () => {
    // Try to connect with injected connector first
    const injected = connectors.find(c => c.id === 'injected');
    if (injected) {
      connect({ connector: injected });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    disconnect();
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
            {isPending ? 'Connecting...' : 'Connect Wallet'}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
          >
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
          <p className="font-mono text-sm break-all">{formatAddress(address)}</p>
        </div>

        {/* Balance */}
        {balance && (
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Balance</p>
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
              {chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

