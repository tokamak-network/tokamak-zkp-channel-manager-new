/**
 * Initialize State Page
 * 
 * Initialize channel state (Leader only)
 * Supports channel selection
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChannelFlowStore, useDepositStore, useInitializeStore } from '@/stores';
import { Button, Card, CardContent, CardHeader } from '@tokamak/ui';
import { ChannelSelector } from '@/app/create-channel/_components/ChannelSelector';
import type { Channel } from '@/lib/db';

function InitializeStatePageContent() {
  const searchParams = useSearchParams();
  const channelId = useChannelFlowStore((state) => state.channelId);
  const setChannelId = useChannelFlowStore((state) => state.setChannelId);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelParticipants, setChannelParticipants] = useState<string[]>([]);

  const { areAllDepositsComplete } = useDepositStore();
  const {
    isGeneratingProof,
    proofData,
    isInitializing,
    isConfirmingInitialize,
    setChannelId: setInitializeStoreChannelId,
    setGeneratingProof,
    setProofData,
    setInitializing,
    setInitializeTxHash,
  } = useInitializeStore();

  // Check URL parameter for channelId
  useEffect(() => {
    const channelIdParam = searchParams.get('channelId');
    if (channelIdParam) {
      try {
        const id = BigInt(channelIdParam);
        setChannelId(id);
        setInitializeStoreChannelId(id);
        
        // Fetch channel data
        fetch(`/api/channels/${channelIdParam}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setSelectedChannel(data.data);
              if (data.data.participants) {
                setChannelParticipants(data.data.participants);
              }
            }
          })
          .catch(console.error);
      } catch (error) {
        console.error('Invalid channelId parameter:', error);
      }
    }
  }, [searchParams, setChannelId, setInitializeStoreChannelId]);

  // Load channel data if channelId exists but channel not selected
  useEffect(() => {
    if (channelId && !selectedChannel) {
      fetch(`/api/channels/${channelId.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedChannel(data.data);
            if (data.data.participants) {
              setChannelParticipants(data.data.participants);
            }
          }
        })
        .catch(console.error);
    }
  }, [channelId, selectedChannel]);

  // Initialize store with channelId
  useEffect(() => {
    if (channelId) {
      setInitializeStoreChannelId(channelId);
    }
  }, [channelId, setInitializeStoreChannelId]);

  // Handle channel selection
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    if (channel.channelId) {
      const id = BigInt(channel.channelId);
      setChannelId(id);
      setInitializeStoreChannelId(id);
      
      if (channel.participants) {
        setChannelParticipants(channel.participants);
      }
      
      // Update URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('channelId', channel.channelId);
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const allDepositsComplete = areAllDepositsComplete(channelParticipants);

  const handleGenerateProof = async () => {
    if (!channelId) return;
    
    // TODO: Implement actual proof generation
    console.log('Generating proof...', { channelId: channelId.toString() });

    setGeneratingProof(true);

    // Mock: Simulate proof generation
    setTimeout(() => {
      setProofData({
        pA: [BigInt(1), BigInt(2), BigInt(3), BigInt(4)],
        pB: [BigInt(5), BigInt(6), BigInt(7), BigInt(8), BigInt(9), BigInt(10), BigInt(11), BigInt(12)],
        pC: [BigInt(13), BigInt(14), BigInt(15), BigInt(16)],
        merkleRoot: '0x' + Math.random().toString(16).slice(2, 66),
      });
      setGeneratingProof(false);
    }, 3000);
  };

  const handleInitialize = async () => {
    if (!proofData || !channelId) return;

    // TODO: Implement actual initialize transaction
    console.log('Initializing channel state...', {
      channelId: channelId.toString(),
      proofData,
    });

    setInitializing(true);
    setInitializeTxHash('0x' + Math.random().toString(16).slice(2, 66));

    // Mock: Simulate transaction
    setTimeout(() => {
      setInitializing(false);
      // TODO: Handle success - redirect or show success message
      alert('Channel initialized successfully!');
    }, 2000);
  };

  // Show channel selector if no channel is selected
  if (!channelId && !selectedChannel) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Initialize Channel State</h2>
            <p className="text-sm text-gray-600">
              Select a channel to initialize state (Leader only)
            </p>
          </CardHeader>
        </Card>
        <ChannelSelector
          onSelectChannel={handleSelectChannel}
          selectedChannelId={selectedChannel?.channelId}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Initialize Channel State</h2>
            {channelId && (
              <p className="text-sm text-gray-600">Channel ID: {channelId.toString()}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedChannel(null);
              setChannelId(null);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('channelId');
                window.history.replaceState({}, '', url.toString());
              }
            }}
          >
            Change Channel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deposit Status Check */}
        {!allDepositsComplete && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            ⚠ Waiting for all participants to complete their deposits...
          </div>
        )}

        {/* Proof Generation */}
        <div>
          <h3 className="font-semibold mb-3">Generate ZK Proof</h3>
          {!proofData ? (
            <Button
              onClick={handleGenerateProof}
              disabled={!allDepositsComplete || isGeneratingProof}
              className="w-full"
            >
              {isGeneratingProof ? 'Generating Proof...' : 'Generate Proof'}
            </Button>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              ✓ Proof generated successfully
              <div className="mt-2 text-xs font-mono">
                Merkle Root: {proofData.merkleRoot.slice(0, 20)}...
              </div>
            </div>
          )}
        </div>

        {/* Initialize Button */}
        {proofData && allDepositsComplete && (
          <div>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing || isConfirmingInitialize}
              className="w-full"
            >
              {isInitializing || isConfirmingInitialize
                ? 'Initializing...'
                : 'Initialize Channel State'}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {isConfirmingInitialize && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            Transaction submitted. Waiting for confirmation...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InitializeStatePage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          Initialize State
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Initialize channel state (Leader only)
        </p>
      </div>

      <Suspense fallback={
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <InitializeStatePageContent />
      </Suspense>
    </>
  );
}
