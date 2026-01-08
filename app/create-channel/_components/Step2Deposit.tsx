/**
 * Step 2: Deposit
 * 
 * MPT Key generation and deposit for leader and participants
 */

'use client';

import { useEffect, useState } from 'react';
import { useChannelFlowStore, useDepositStore, useChannelFormStore } from '@/stores';
import { Button, Input, Label, Card, CardContent, CardHeader } from '@tokamak/ui';

export function Step2Deposit() {
  const channelId = useChannelFlowStore((state) => state.channelId);
  const participants = useChannelFormStore((state) => state.participants);
  
  const {
    deposits,
    currentUserDeposit,
    setChannelId,
    setCurrentUserDepositAmount,
    setCurrentUserMPTKey,
    setDepositing,
    setDeposit,
    areAllDepositsComplete,
  } = useDepositStore();

  const [mptKey, setMptKey] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Initialize deposit store with channelId
  useEffect(() => {
    if (channelId) {
      setChannelId(channelId);
    }
  }, [channelId, setChannelId]);

  // Generate MPT Key (mock - should be deterministic based on address)
  const generateMPTKey = () => {
    // TODO: Implement actual MPT key generation
    // For now, generate a mock key
    const mockKey = `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`;
    setMptKey(mockKey);
    setCurrentUserMPTKey(mockKey);
  };

  const handleDeposit = async () => {
    if (!depositAmount || !mptKey || !channelId) return;

    // TODO: Implement actual deposit transaction
    console.log('Depositing...', {
      channelId: channelId.toString(),
      amount: depositAmount,
      mptKey,
    });

    setDepositing(true);

    // Mock: Simulate deposit
    setTimeout(() => {
      const amount = BigInt(parseFloat(depositAmount) * 1e18); // Assuming 18 decimals
      setDeposit('current-user-address', {
        amount,
        mptKey,
        completed: true,
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
      });
      setDepositing(false);
    }, 2000);
  };

  const allDepositsComplete = areAllDepositsComplete(
    participants.map(p => p.address)
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Step 2: Deposit Tokens</h2>
        {channelId && (
          <p className="text-sm text-gray-600">Channel ID: {channelId.toString()}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MPT Key Generation */}
        <div>
          <Label required>MPT Key</Label>
          <div className="flex gap-2">
            <Input
              value={mptKey}
              onChange={(e) => {
                setMptKey(e.target.value);
                setCurrentUserMPTKey(e.target.value);
              }}
              placeholder="Generate or enter MPT key"
            />
            <Button variant="outline" onClick={generateMPTKey}>
              Generate
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            MPT key is required for deposit
          </p>
        </div>

        {/* Deposit Amount */}
        <div>
          <Label htmlFor="depositAmount" required>
            Deposit Amount
          </Label>
          <Input
            id="depositAmount"
            type="number"
            value={depositAmount}
            onChange={(e) => {
              setDepositAmount(e.target.value);
              setCurrentUserDepositAmount(
                e.target.value ? BigInt(parseFloat(e.target.value) * 1e18) : null
              );
            }}
            placeholder="0.0"
            step="0.000001"
          />
        </div>

        {/* Deposit Status */}
        {currentUserDeposit.completed && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Deposit completed
            {currentUserDeposit.txHash && (
              <div className="mt-1 text-xs">Tx: {currentUserDeposit.txHash.slice(0, 20)}...</div>
            )}
          </div>
        )}

        {/* Error */}
        {currentUserDeposit.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {currentUserDeposit.error}
          </div>
        )}

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={
            !depositAmount ||
            !mptKey ||
            currentUserDeposit.isDepositing ||
            currentUserDeposit.completed
          }
          className="w-full"
        >
          {currentUserDeposit.isDepositing
            ? 'Depositing...'
            : currentUserDeposit.completed
            ? 'Deposit Completed'
            : 'Deposit Tokens'}
        </Button>

        {/* Participants Deposit Status */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Participants Deposit Status</h3>
          <div className="space-y-2">
            {participants.map((participant, index) => {
              const deposit = deposits[participant.address.toLowerCase()];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm font-mono">
                    {participant.address.slice(0, 10)}...
                  </span>
                  <span className="text-sm">
                    {deposit?.completed ? (
                      <span className="text-green-600">✓ Completed</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Deposits Complete */}
        {allDepositsComplete && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            All participants have completed their deposits. You can proceed to Step 3.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

