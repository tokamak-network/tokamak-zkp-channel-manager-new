'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Hash, 
  FolderArchive, 
  Loader2, 
  ExternalLink,
  Upload
} from 'lucide-react';
import { useBridgeCoreRead } from '@/hooks/contract/useBridgeCore';
import { useBridgeProofManagerWrite, useBridgeProofManagerWaitForReceipt } from '@/hooks/contract/useBridgeProofManager';
import { getContractAbi, getContractAddress } from '@tokamak/config';
import { useNetworkId } from '@/hooks/contract/utils';

interface ProofData {
  proofPart1: bigint[];
  proofPart2: bigint[];
  publicInputs: bigint[];
  smax: bigint;
}

interface RawProofJson {
  proof_entries_part1: string[];
  proof_entries_part2: string[];
  a_pub_user: string[];
  a_pub_block: string[];
  a_pub_function: string[];
}

interface UploadedProof {
  id: string;
  file: File | null;
  data: ProofData;
  source?: 'db' | 'upload';
  sequenceNumber?: number;
}

interface SignatureInputs {
  rx: string;
  ry: string;
  z: string;
}

interface Signature {
  message: `0x${string}`;
  rx: bigint;
  ry: bigint;
  z: bigint;
}

export default function SubmitProofPage() {
  const { address, isConnected } = useAccount();
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [uploadedProofs, setUploadedProofs] = useState<UploadedProof[]>([]);
  const [signatureInputs, setSignatureInputs] = useState<SignatureInputs>({
    rx: '',
    ry: '',
    z: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [proofError, setProofError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [requireSignature, setRequireSignature] = useState(true);

  // Get channel info from contract
  const { data: channelInfo } = useBridgeCoreRead({
    functionName: 'getChannelInfo',
    args: selectedChannelId ? [BigInt(selectedChannelId)] : undefined,
    query: {
      enabled: Boolean(selectedChannelId && isConnected),
    },
  });

  const { data: channelParticipants } = useBridgeCoreRead({
    functionName: 'getChannelParticipants',
    args: selectedChannelId ? [BigInt(selectedChannelId)] : undefined,
    query: {
      enabled: Boolean(selectedChannelId && isConnected),
    },
  });

  const { data: targetContract } = useBridgeCoreRead({
    functionName: 'getChannelTargetContract',
    args: selectedChannelId ? [BigInt(selectedChannelId)] : undefined,
    query: {
      enabled: Boolean(selectedChannelId && isConnected),
    },
  });

  // Check if channel has frost signatures enabled
  const { data: isFrostSignatureEnabled } = useBridgeCoreRead({
    functionName: 'isFrostSignatureEnabled',
    args: selectedChannelId ? [BigInt(selectedChannelId)] : undefined,
    query: {
      enabled: Boolean(selectedChannelId && isConnected),
    },
  });

  // Update signature requirement based on frost signature setting
  useEffect(() => {
    if (isFrostSignatureEnabled !== undefined) {
      setRequireSignature(isFrostSignatureEnabled);
    }
  }, [isFrostSignatureEnabled]);

  // Load proofs from database when channel is selected
  useEffect(() => {
    const loadProofsFromDb = async () => {
      if (!selectedChannelId) {
        setUploadedProofs([]);
        return;
      }

      setIsLoadingProofs(true);
      setProofError('');

      try {
        const response = await fetch(`/api/channels/${selectedChannelId}/proofs?type=verified`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load proofs');
        }

        const proofs = result.data || [];

        if (proofs.length === 0) {
          setUploadedProofs([]);
          setIsLoadingProofs(false);
          return;
        }

        // Convert database proofs to UploadedProof format
        const formattedProofs: UploadedProof[] = proofs.map((proof: any) => {
          // Extract proof data from database format
          // Assuming proof.proofData contains the proof information
          const proofData = proof.proofData || proof;
          
          // Try to parse if it's a string
          let parsedData: any;
          if (typeof proofData === 'string') {
            try {
              parsedData = JSON.parse(proofData);
            } catch {
              parsedData = proofData;
            }
          } else {
            parsedData = proofData;
          }

          // Format proof data to match contract requirements
          const formattedProof: ProofData = {
            proofPart1: (parsedData.proof_entries_part1 || parsedData.proofPart1 || []).map((x: string | bigint) => 
              typeof x === 'string' ? BigInt(x.startsWith('0x') ? x : `0x${x}`) : BigInt(x)
            ),
            proofPart2: (parsedData.proof_entries_part2 || parsedData.proofPart2 || []).map((x: string | bigint) => 
              typeof x === 'string' ? BigInt(x.startsWith('0x') ? x : `0x${x}`) : BigInt(x)
            ),
            publicInputs: (() => {
              // Combine a_pub_user, a_pub_block, a_pub_function if they exist separately
              if (parsedData.a_pub_user && parsedData.a_pub_block && parsedData.a_pub_function) {
                return [
                  ...parsedData.a_pub_user,
                  ...parsedData.a_pub_block,
                  ...parsedData.a_pub_function,
                ].map((x: string | bigint) => 
                  typeof x === 'string' ? BigInt(x.startsWith('0x') ? x : `0x${x}`) : BigInt(x)
                );
              }
              // Otherwise use publicInputs if available
              return (parsedData.publicInputs || []).map((x: string | bigint) => 
                typeof x === 'string' ? BigInt(x.startsWith('0x') ? x : `0x${x}`) : BigInt(x)
              );
            })(),
            smax: BigInt(parsedData.smax || 256),
          };

          return {
            id: `db_${proof.key || proof.sequenceNumber || Date.now()}`,
            file: null,
            data: formattedProof,
            source: 'db',
            sequenceNumber: proof.sequenceNumber,
          };
        });

        // Sort by sequenceNumber
        formattedProofs.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

        setUploadedProofs(formattedProofs);
      } catch (error) {
        console.error('Error loading proofs from database:', error);
        setProofError(error instanceof Error ? error.message : 'Failed to load proofs from database');
      } finally {
        setIsLoadingProofs(false);
      }
    };

    loadProofsFromDb();
  }, [selectedChannelId]);

  // Compute final state root from the last proof's a_pub_user[0] (lower) and a_pub_user[1] (upper)
  const finalStateRoot = useMemo(() => {
    if (uploadedProofs.length === 0) return null;
    const lastProof = uploadedProofs[uploadedProofs.length - 1];
    if (lastProof.data.publicInputs.length < 12) return null;
    
    // a_pub_user[0] = lower 16 bytes, a_pub_user[1] = upper 16 bytes of resulting merkle root
    const lowerBytes = lastProof.data.publicInputs[0];
    const upperBytes = lastProof.data.publicInputs[1];
    
    // Combine: upper (16 bytes) + lower (16 bytes) = 32 bytes
    const lowerHex = lowerBytes.toString(16).padStart(32, '0');
    const upperHex = upperBytes.toString(16).padStart(32, '0');
    
    return `0x${upperHex}${lowerHex}` as `0x${string}`;
  }, [uploadedProofs]);
  
  // Compute message hash for signature: keccak256(abi.encodePacked(channelId, finalStateRoot))
  const computedMessageHash = useMemo(() => {
    if (!selectedChannelId || !finalStateRoot) return null;
    
    try {
      const channelIdBigInt = BigInt(selectedChannelId);
      const messageHash = keccak256(encodePacked(
        ['uint256', 'bytes32'],
        [channelIdBigInt, finalStateRoot]
      ));
      
      return messageHash;
    } catch (error) {
      console.error('Error computing message hash:', error);
      return null;
    }
  }, [selectedChannelId, finalStateRoot]);
  
  // Build signature object for contract call
  const signature = useMemo<Signature | null>(() => {
    if (!computedMessageHash || !signatureInputs.rx || !signatureInputs.ry || !signatureInputs.z) {
      return null;
    }
    
    try {
      return {
        message: computedMessageHash,
        rx: BigInt(signatureInputs.rx),
        ry: BigInt(signatureInputs.ry),
        z: BigInt(signatureInputs.z)
      };
    } catch (error) {
      console.error('Error parsing signature inputs:', error);
      return null;
    }
  }, [computedMessageHash, signatureInputs]);

  // Helper function to get channel state display name
  const getChannelStateDisplay = (stateNumber: number) => {
    const states = {
      0: 'None',
      1: 'Initialized', 
      2: 'Open',
      3: 'Closing',
      4: 'Closed'
    };
    return states[stateNumber as keyof typeof states] || 'Unknown';
  };

  // Get channel state colors
  const getChannelStateColor = (stateNumber: number) => {
    const colors = {
      0: 'text-gray-500',
      1: 'text-blue-400',
      2: 'text-green-400',
      3: 'text-yellow-400',
      4: 'text-red-400'
    };
    return colors[stateNumber as keyof typeof colors] || 'text-gray-500';
  };

  // Contract write
  const networkId = useNetworkId();
  const { writeContract, isPending: isWritePending } = useBridgeProofManagerWrite();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  
  const { isLoading: isTransactionLoading, isSuccess } = useBridgeProofManagerWaitForReceipt({
    hash: txHash || undefined,
  });

  // File upload handlers
  const handleProofFileUpload = async (file: File) => {
    try {
      setProofError('');
      
      // Check if we already have 5 proofs
      if (uploadedProofs.length >= 5) {
        setProofError('Maximum of 5 proofs allowed');
        return;
      }
      
      const text = await file.text();
      const jsonData = JSON.parse(text) as RawProofJson;
      
      // Validate required proof fields
      const requiredFields = ['proof_entries_part1', 'proof_entries_part2', 'a_pub_user', 'a_pub_block', 'a_pub_function'];
      const missingFields = requiredFields.filter(field => !jsonData[field as keyof RawProofJson]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required proof fields: ${missingFields.join(', ')}`);
      }
      
      // Validate array structures
      if (!Array.isArray(jsonData.proof_entries_part1) || !Array.isArray(jsonData.proof_entries_part2)) {
        throw new Error('proof_entries_part1 and proof_entries_part2 must be arrays');
      }
      if (!Array.isArray(jsonData.a_pub_user) || !Array.isArray(jsonData.a_pub_block) || !Array.isArray(jsonData.a_pub_function)) {
        throw new Error('a_pub_user, a_pub_block, and a_pub_function must be arrays');
      }
      
      // Concatenate public inputs: a_pub_user + a_pub_block + a_pub_function
      const publicInputsRaw = [...jsonData.a_pub_user, ...jsonData.a_pub_block, ...jsonData.a_pub_function];
      
      // Convert and validate proof data
      const newProofData: ProofData = {
        proofPart1: jsonData.proof_entries_part1.map((x: string) => BigInt(x.startsWith('0x') ? x : `0x${x}`)),
        proofPart2: jsonData.proof_entries_part2.map((x: string) => BigInt(x.startsWith('0x') ? x : `0x${x}`)),
        publicInputs: publicInputsRaw.map((x: string) => BigInt(x.startsWith('0x') ? x : `0x${x}`)),
        smax: BigInt(256),
      };
      
      // Create new uploaded proof with unique ID
      const newUploadedProof: UploadedProof = {
        id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        data: newProofData,
        source: 'upload',
      };
      
      setUploadedProofs(prev => [...prev, newUploadedProof]);
      
    } catch (error) {
      console.error('Error parsing proof file:', error);
      setProofError(error instanceof Error ? error.message : 'Invalid proof file format');
    }
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, proofId: string) => {
    setDraggedItemId(proofId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      return;
    }
    
    setUploadedProofs(prev => {
      const draggedIndex = prev.findIndex(p => p.id === draggedItemId);
      const targetIndex = prev.findIndex(p => p.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newProofs = [...prev];
      const [draggedItem] = newProofs.splice(draggedIndex, 1);
      newProofs.splice(targetIndex, 0, draggedItem);
      
      return newProofs;
    });
    
    setDraggedItemId(null);
  };
  
  const removeProof = (proofId: string) => {
    setUploadedProofs(prev => prev.filter(p => p.id !== proofId));
  };
  
  // View formatted JSON in new tab
  const viewFormattedJson = (proof: UploadedProof) => {
    // Convert BigInt values back to hex strings for display
    const formattedData = {
      proof_entries_part1: proof.data.proofPart1.map(n => '0x' + n.toString(16)),
      proof_entries_part2: proof.data.proofPart2.map(n => '0x' + n.toString(16)),
      a_pub_user: proof.data.publicInputs.slice(0, 40).map(n => '0x' + n.toString(16)),
      a_pub_block: proof.data.publicInputs.slice(40, 64).map(n => '0x' + n.toString(16)),
      a_pub_function: proof.data.publicInputs.slice(64).map(n => '0x' + n.toString(16)),
      _metadata: {
        fileName: proof.file?.name || 'Database Proof',
        totalPublicInputs: proof.data.publicInputs.length,
        smax: proof.data.smax.toString(),
        generatedAt: new Date().toISOString()
      }
    };
    
    // Create a blob and open in new tab
    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };
  
  // Form validation
  function isFormValid(): boolean {
    const basicRequirements = Boolean(
      selectedChannelId &&
      uploadedProofs.length > 0 &&
      uploadedProofs.length <= 5
    );
    
    // If frost signatures are not required, only basic requirements matter
    if (!requireSignature) {
      return basicRequirements;
    }
    
    // If frost signatures are required, also check signature inputs
    return Boolean(
      basicRequirements &&
      signatureInputs.rx &&
      signatureInputs.ry &&
      signatureInputs.z &&
      computedMessageHash &&
      signature
    );
  }
  
  // Submit handler
  const handleSubmit = async () => {
    if (!selectedChannelId || !isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!writeContract) {
      alert('Contract write not ready');
      return;
    }

    try {
      setIsLoading(true);

      const proofManagerAbi = getContractAbi('BridgeProofManager');
      const proofManagerAddress = getContractAddress('BridgeProofManager', networkId);
      
      const hash = await writeContract({
        address: proofManagerAddress,
        abi: proofManagerAbi,
        functionName: 'submitProofAndSignature',
        args: [
          BigInt(selectedChannelId),
          uploadedProofs.map(p => p.data),
          requireSignature && signature ? signature : {
            message: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
            rx: BigInt(0),
            ry: BigInt(0),
            z: BigInt(0)
          }
        ],
      });

      setTxHash(hash);
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Error submitting proof. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if channel is in correct state for proof submission (Open=2)
  const isChannelStateValid = channelInfo && Number(channelInfo[1]) === 2;
  
  const canSubmit = isConnected && selectedChannelId && isFormValid() && isChannelStateValid && !isLoading && !isTransactionLoading && !isWritePending;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-blue-500 flex items-center justify-center rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Submit Ordered Proofs & Signature</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-13">
          Upload individual proof files (max 5), arrange in order, and submit with group signature
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center rounded-lg">
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 flex items-center justify-center mx-auto mb-4 rounded-lg">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to submit proofs
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Selection */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-blue-500 flex items-center justify-center rounded-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Channel Selection</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Select the channel you want to submit proofs for
                </p>
              </div>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium mb-2">
                Channel ID *
              </label>
              <input
                type="text"
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                placeholder="Enter channel ID (e.g., 1, 2, 3...)"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Channel Overview */}
          {selectedChannelId && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-blue-500 flex items-center justify-center rounded-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Channel Information</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Review channel status before submitting proofs
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Channel ID</div>
                  <div className="text-lg font-semibold">#{selectedChannelId}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <div className={`text-lg font-semibold ${channelInfo ? getChannelStateColor(Number(channelInfo[1])) : 'text-gray-400'}`}>
                    {channelInfo ? getChannelStateDisplay(Number(channelInfo[1])) : 'Loading...'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
                  <div className="text-lg font-semibold">
                    {channelParticipants ? channelParticipants.length : '...'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Target Contract</div>
                  <div className="text-lg font-semibold font-mono text-xs">
                    {targetContract ? `${targetContract.substring(0, 8)}...${targetContract.substring(36)}` : '...'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Proof Data Upload */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2">
                Individual Proof Files
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Proofs are automatically loaded from database. You can also upload additional proof files (max 5). Drag to reorder - order matters!
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {isLoadingProofs && (
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading proofs from database...</span>
                </div>
              )}

              {/* Upload area */}
              <div className="max-w-2xl mx-auto">
                <label className="block text-sm font-medium mb-4">
                  Add Proof File (JSON) - {uploadedProofs.length}/5
                </label>
                
                {uploadedProofs.length < 5 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors mb-6">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProofFileUpload(file);
                      }}
                      className="hidden"
                      id="proof-file"
                    />
                    <label htmlFor="proof-file" className="cursor-pointer">
                      <div className="text-gray-500 dark:text-gray-400">
                        <FileText className="mx-auto h-16 w-16 mb-4" />
                        <p className="text-lg font-medium mb-2">Click to upload proof file</p>
                        <p className="text-sm">Upload JSON containing exactly one function proof</p>
                      </div>
                    </label>
                  </div>
                )}
                
                {/* Uploaded proofs list with drag and drop */}
                {uploadedProofs.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      Uploaded Proofs (drag to reorder):
                    </div>
                    {uploadedProofs.map((proof, index) => (
                      <div
                        key={proof.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, proof.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, proof.id)}
                        className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 cursor-move hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors ${
                          draggedItemId === proof.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div className="text-sm">
                                <div className="font-semibold text-green-800 dark:text-green-200">
                                  {proof.file?.name || `Database Proof #${proof.sequenceNumber || index + 1}`}
                                </div>
                                <div className="text-green-600 dark:text-green-400 text-xs">
                                  Inputs: {proof.data.publicInputs.length} elements
                                  {proof.source === 'db' && ' • From Database'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewFormattedJson(proof);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                              title="View formatted JSON"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <div className="text-gray-400 text-xs">≡</div>
                            <button
                              onClick={() => removeProof(proof.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {proofError && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-red-400 text-sm">{proofError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signature Input (only shown when frost signatures are enabled) */}
          {requireSignature ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-2">
                  Group Threshold Signature
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the signature components (rx, ry, z) from your off-chain signing ceremony
                </p>
              </div>
            
              <div className="p-6 space-y-6">
                {/* Message Hash Display */}
                {computedMessageHash && finalStateRoot && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1">
                          Computed Message Hash
                        </div>
                        <div className="text-xs font-mono break-all bg-white dark:bg-blue-900/30 p-2 rounded border">
                          {computedMessageHash}
                        </div>
                        <div className="text-xs mt-2">
                          keccak256(abi.encodePacked(channelId: {selectedChannelId}, finalStateRoot: {finalStateRoot}))
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-2xl mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Signature Component rx *
                    </label>
                    <input
                      type="text"
                      value={signatureInputs.rx}
                      onChange={(e) => {
                        setSignatureInputs(prev => ({ ...prev, rx: e.target.value }));
                        setSignatureError('');
                      }}
                      placeholder="Enter rx value (decimal)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Signature Component ry *
                    </label>
                    <input
                      type="text"
                      value={signatureInputs.ry}
                      onChange={(e) => {
                        setSignatureInputs(prev => ({ ...prev, ry: e.target.value }));
                        setSignatureError('');
                      }}
                      placeholder="Enter ry value (decimal)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Signature Component z *
                    </label>
                    <input
                      type="text"
                      value={signatureInputs.z}
                      onChange={(e) => {
                        setSignatureInputs(prev => ({ ...prev, z: e.target.value }));
                        setSignatureError('');
                      }}
                      placeholder="Enter z value (decimal)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {signature && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <span className="text-sm font-medium">
                          Signature Ready
                        </span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        All signature components are valid and message hash computed successfully
                      </div>
                    </div>
                  )}

                  {signatureError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-400 text-sm">{signatureError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 text-center">
                <div className="h-16 w-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No Signature Required
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This channel operates without frost signatures. Only proof submission is required.
                </p>
              </div>
            </div>
          )}
          
          {/* Submit Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6">
              {/* Status Messages */}
              {!isFormValid() && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block mb-1">Missing Required Data</strong>
                    {!selectedChannelId && "Please enter a channel ID"}
                    {selectedChannelId && uploadedProofs.length === 0 && "Please upload at least one proof file"}
                    {requireSignature && selectedChannelId && uploadedProofs.length > 0 && (!signatureInputs.rx || !signatureInputs.ry || !signatureInputs.z) && "Please enter all signature components (rx, ry, z)"}
                    {requireSignature && selectedChannelId && uploadedProofs.length > 0 && signatureInputs.rx && signatureInputs.ry && signatureInputs.z && !signature && "Invalid signature values - please check your inputs"}
                  </div>
                </div>
              )}
              
              {isFormValid() && !isChannelStateValid && channelInfo && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block mb-1">Invalid Channel State</strong>
                    Channel must be in "Open" state. Current: {getChannelStateDisplay(Number(channelInfo[1]))}
                  </div>
                </div>
              )}

              
              {isSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block mb-1">Success!</strong>
                    Proof and signature submitted successfully! Channel is now in Closing state.
                  </div>
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  canSubmit
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading || isTransactionLoading || isWritePending ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Ordered Proofs & Signature'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
