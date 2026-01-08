/**
 * Step 1: Create Channel
 * 
 * Form for creating a channel transaction
 */

'use client';

import { useState } from 'react';
import { useChannelFormStore, useChannelFlowStore } from '@/stores';
import { Button, Input, Label, Card, CardContent, CardHeader } from '@tokamak/ui';

export function Step1CreateChannel() {
  const {
    channelName,
    targetContract,
    participants,
    enableFrostSignature,
    setChannelName,
    setTargetContract,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setEnableFrostSignature,
    isValid,
  } = useChannelFormStore();

  const {
    isCreatingChannel,
    createChannelTxHash,
    isConfirmingCreate,
    createChannelError,
    onChannelCreated,
  } = useChannelFlowStore();

  const [newParticipantAddress, setNewParticipantAddress] = useState('');

  const handleAddParticipant = () => {
    if (newParticipantAddress && /^0x[a-fA-F0-9]{40}$/.test(newParticipantAddress)) {
      addParticipant(newParticipantAddress as `0x${string}`);
      setNewParticipantAddress('');
    }
  };

  const handleCreateChannel = async () => {
    // TODO: Implement actual contract call
    // For now, mock the creation
    console.log('Creating channel...', {
      channelName,
      targetContract,
      participants: participants.map(p => p.address),
      enableFrostSignature,
    });

    // Mock: Simulate transaction
    useChannelFlowStore.getState().setCreatingChannel(true);
    
    setTimeout(() => {
      // Mock channel ID
      const mockChannelId = BigInt(1);
      onChannelCreated(mockChannelId);
      useChannelFlowStore.getState().setCreatingChannel(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Step 1: Create Channel</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Name */}
        <div>
          <Label htmlFor="channelName">Channel Name (Optional)</Label>
          <Input
            id="channelName"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Enter channel name"
          />
        </div>

        {/* Target Contract */}
        <div>
          <Label htmlFor="targetContract" required>
            Target Contract Address
          </Label>
          <Input
            id="targetContract"
            value={targetContract || ''}
            onChange={(e) => setTargetContract(e.target.value as `0x${string}`)}
            placeholder="0x..."
          />
        </div>

        {/* Participants */}
        <div>
          <Label required>Participants</Label>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={participant.address}
                  onChange={(e) => updateParticipant(index, e.target.value as `0x${string}`)}
                  placeholder="0x..."
                />
                <Button
                  variant="outline"
                  onClick={() => removeParticipant(index)}
                  disabled={participants.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Input
                value={newParticipantAddress}
                onChange={(e) => setNewParticipantAddress(e.target.value)}
                placeholder="Add participant address (0x...)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handleAddParticipant}
                disabled={!newParticipantAddress || !/^0x[a-fA-F0-9]{40}$/.test(newParticipantAddress)}
              >
                Add
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Minimum 1 participant required
          </p>
        </div>

        {/* FROST Signature */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableFrostSignature}
              onChange={(e) => setEnableFrostSignature(e.target.checked)}
            />
            <span>Enable FROST Signature</span>
          </label>
        </div>

        {/* Error Message */}
        {createChannelError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {createChannelError}
          </div>
        )}

        {/* Transaction Status */}
        {createChannelTxHash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            Transaction: {createChannelTxHash}
            {isConfirmingCreate && ' (Confirming...)'}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCreateChannel}
          disabled={!isValid() || isCreatingChannel || isConfirmingCreate}
          className="w-full"
        >
          {isCreatingChannel || isConfirmingCreate
            ? 'Creating Channel...'
            : 'Create Channel'}
        </Button>
      </CardContent>
    </Card>
  );
}

