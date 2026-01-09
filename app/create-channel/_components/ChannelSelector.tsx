/**
 * Channel Selector Component
 * 
 * Displays a list of existing channels and allows selection
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, Button, Badge } from '@tokamak/ui';
import type { Channel } from '@/lib/db';

interface ChannelSelectorProps {
  onSelectChannel: (channel: Channel) => void;
  selectedChannelId?: string | null;
}

export function ChannelSelector({
  onSelectChannel,
  selectedChannelId,
}: ChannelSelectorProps) {
  const { address } = useAccount();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, [address]);

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch channels where user is a participant
      const url = address
        ? `/api/channels?user=${address}`
        : '/api/channels';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setChannels(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch channels');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'frozen':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading channels...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchChannels}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500 mb-4">No channels found</p>
          <p className="text-sm text-gray-400">
            {address
              ? "You don't have any channels yet. Create a new channel to get started."
              : 'Connect your wallet to see your channels.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Channel</h3>
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {channels.map((channel) => {
            const isSelected = selectedChannelId === channel.channelId;
            return (
              <button
                key={channel.channelId}
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-semibold">
                        Channel #{channel.channelId}
                      </span>
                      {channel.status && (
                        <Badge className={getStatusColor(channel.status)}>
                          {channel.status}
                        </Badge>
                      )}
                    </div>
                    {channel.targetContract && (
                      <p className="text-sm text-gray-600 font-mono mb-1">
                        Contract: {channel.targetContract.slice(0, 10)}...
                      </p>
                    )}
                    {channel.participants && (
                      <p className="text-xs text-gray-500">
                        {channel.participants.length} participant
                        {channel.participants.length !== 1 ? 's' : ''}
                      </p>
                    )}
                    {channel.openChannelTxHash && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Tx: {channel.openChannelTxHash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="ml-4 text-blue-600">✓</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
