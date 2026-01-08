/**
 * Step 3: Initialize State
 * 
 * Initialize channel state (Leader only)
 */

'use client';

import { useEffect } from 'react';
import { useChannelFlowStore, useDepositStore, useInitializeStore, useChannelFormStore } from '@/stores';
import { Button, Card, CardContent, CardHeader } from '@tokamak/ui';

export function Step3InitializeState() {
  const channelId = useChannelFlowStore((state) => state.channelId);
  const participants = useChannelFormStore((state) => state.participants);
  
  const { areAllDepositsComplete } = useDepositStore();
  const {
    isGeneratingProof,
    proofData,
    isInitializing,
    isConfirmingInitialize,
    setChannelId,
    setGeneratingProof,
    setProofData,
    setInitializing,
    setInitializeTxHash,
  } = useInitializeStore();

  // Initialize store with channelId
  useEffect(() => {
    if (channelId) {
      setChannelId(channelId);
    }
  }, [channelId, setChannelId]);

  const allDepositsComplete = areAllDepositsComplete(
    participants.map(p => p.address)
  );

  const handleGenerateProof = async () => {
    // TODO: Implement actual proof generation
    console.log('Generating proof...', { channelId: channelId?.toString() });

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

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Step 3: Initialize Channel State</h2>
        {channelId && (
          <p className="text-sm text-gray-600">Channel ID: {channelId.toString()}</p>
        )}
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

