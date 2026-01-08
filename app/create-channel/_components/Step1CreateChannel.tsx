/**
 * Step 1: Create Channel
 * 
 * Form for creating a channel transaction
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { decodeEventLog } from 'viem';
import { useChannelFormStore, useChannelFlowStore } from '@/stores';
import { Button, Input, Label, Card, CardContent, CardHeader } from '@tokamak/ui';
import { getContractAbi, getContractAddress } from '@tokamak/config';
import { useBridgeCoreWrite, useBridgeCoreWaitForReceipt } from '@/hooks/contract';
import { useNetworkId } from '@/hooks/contract/utils';

const FIXED_TARGET_CONTRACT = '0xa30fe40285B8f5c0457DbC3B7C8A280373c40044' as `0x${string}`;

export function Step1CreateChannel() {
  const { address, isConnected } = useAccount();
  
  const {
    participants,
    setTargetContract,
    updateParticipant,
    setParticipants,
    isValid,
  } = useChannelFormStore();

  const {
    isCreatingChannel,
    createChannelTxHash,
    isConfirmingCreate,
    createChannelError,
    onChannelCreated,
    setCreatingChannel,
    setCreateChannelTxHash,
    setCreateChannelError,
    setConfirmingCreate,
  } = useChannelFlowStore();

  // Initialize participant count from store
  const [participantCount, setParticipantCount] = useState<number>(
    Math.max(1, participants.length || 1)
  );

  // Initialize target contract on mount
  useEffect(() => {
    setTargetContract(FIXED_TARGET_CONTRACT);
  }, [setTargetContract]);

  // Initialize participants on mount (only once)
  useEffect(() => {
    const store = useChannelFormStore.getState();
    if (store.participants.length === 0) {
      const initialCount = Math.max(1, participantCount);
      const initialParticipants = Array(initialCount)
        .fill(null)
        .map(() => ({ address: '0x0000000000000000000000000000000000000000' as `0x${string}` }));
      store.setParticipants(initialParticipants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync participants array with participantCount
  useEffect(() => {
    const store = useChannelFormStore.getState();
    const currentCount = store.participants.length;
    const targetCount = participantCount;

    if (currentCount !== targetCount) {
      // Create new participants array with the target count
      const newParticipants = Array(targetCount)
        .fill(null)
        .map((_, index) => {
          // Keep existing participant if available, otherwise use empty address
          return store.participants[index] || { address: '0x0000000000000000000000000000000000000000' as `0x${string}` };
        });
      
      setParticipants(newParticipants);
    }
  }, [participantCount, setParticipants]);

  // Handle participant count change
  const handleParticipantCountChange = (count: number) => {
    const numCount = Math.max(1, count);
    setParticipantCount(numCount);
  };

  const networkId = useNetworkId();
  const contractAddress = getContractAddress('BridgeCore', networkId);
  const abi = getContractAbi('BridgeCore');

  // Prepare contract call parameters
  const channelParams = useMemo(() => {
    if (!isValid() || !isConnected) return undefined;
    
    return {
      targetContract: FIXED_TARGET_CONTRACT,
      whitelisted: participants.map(p => p.address),
      enableFrostSignature: false,
    };
  }, [isValid, isConnected, participants]);

  // Contract write hook
  const { 
    writeContract,
    isPending: isWriting,
    data: txHash,
    error: writeError,
  } = useBridgeCoreWrite();

  // Wait for transaction confirmation
  const { 
    isLoading: isWaiting, 
    isSuccess,
    data: receipt,
    error: waitError,
  } = useBridgeCoreWaitForReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
      retry: true,
    },
  });

  // Handle transaction success
  useEffect(() => {
    if (receipt && isSuccess) {
      // Extract channel ID from transaction receipt logs
      try {
        let channelId: bigint | null = null;
        
        // Look for ChannelOpened event in the logs
        if (receipt.logs && receipt.logs.length > 0) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === 'ChannelOpened') {
                channelId = decoded.args.channelId as bigint;
                break;
              }
            } catch (e) {
              // Not a ChannelOpened event, continue
              continue;
            }
          }
        }
        
        if (channelId === null) {
          throw new Error('ChannelOpened event not found in transaction logs');
        }
        
        onChannelCreated(channelId);
        setCreateChannelTxHash('');
        setConfirmingCreate(false);
        setCreatingChannel(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to extract channel ID from transaction';
        setCreateChannelError(errorMessage);
        setConfirmingCreate(false);
        setCreatingChannel(false);
      }
    }
  }, [receipt, isSuccess, abi, onChannelCreated, setCreateChannelTxHash, setConfirmingCreate, setCreatingChannel, setCreateChannelError]);

  // Update store states based on wagmi hooks
  useEffect(() => {
    setCreatingChannel(isWriting);
  }, [isWriting, setCreatingChannel]);

  useEffect(() => {
    setConfirmingCreate(isWaiting);
  }, [isWaiting, setConfirmingCreate]);

  useEffect(() => {
    if (txHash) {
      setCreateChannelTxHash(txHash);
    }
  }, [txHash, setCreateChannelTxHash]);

  useEffect(() => {
    if (writeError) {
      setCreateChannelError(writeError.message);
      setCreatingChannel(false);
    } else if (waitError) {
      setCreateChannelError(waitError.message);
      setConfirmingCreate(false);
      setCreatingChannel(false);
    }
  }, [writeError, waitError, setCreateChannelError, setCreatingChannel, setConfirmingCreate]);

  const handleCreateChannel = async () => {
    if (!channelParams || !isValid() || !isConnected) return;
    
    try {
      setCreateChannelError(null);
      setCreatingChannel(true);
      
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'openChannel',
        args: [channelParams],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create channel';
      setCreateChannelError(errorMessage);
      setCreatingChannel(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Step 1: Create Channel</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Contract */}
        <div>
          <Label htmlFor="targetContract" required>
            Target Contract Address
          </Label>
          <Input
            id="targetContract"
            value={FIXED_TARGET_CONTRACT}
            disabled
            readOnly
          />
        </div>

        {/* Participants */}
        <div>
          <Label htmlFor="participantCount" required>
            Number of Participants
          </Label>
          <Input
            id="participantCount"
            type="number"
            min="1"
            value={participantCount}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 1;
              handleParticipantCountChange(count);
            }}
            placeholder="Enter number of participants"
            className="mb-4"
          />
          
          <Label required>Participants</Label>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index}>
                <Input
                  value={participant.address}
                  onChange={(e) => updateParticipant(index, e.target.value as `0x${string}`)}
                  placeholder="Add participant address (0x...)"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Minimum 1 participant required
          </p>
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

