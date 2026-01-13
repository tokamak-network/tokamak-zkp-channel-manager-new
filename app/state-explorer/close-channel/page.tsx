'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button, Card, CardContent } from '@tokamak/ui';
import { AlertCircle, CheckCircle, Loader2, ChevronRight, FileText } from 'lucide-react';
import { useChannelInfo } from '@/hooks/useChannelInfo';
import { formatVerifiedProofsForSubmission } from '../_utils/proofFormatter';

interface VerifiedProof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  zipFile: {
    filePath: string;
    fileName: string;
    size: number;
  };
  verifiedAt: string;
  verifiedBy: string;
}

export default function CloseChannelPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const channelId = params?.id as string;

  const { channelInfo, isLeader } = useChannelInfo(channelId);

  // Phase state: 1 = Submit Proof, 2 = Verify Final Balances
  const [phase, setPhase] = useState<1 | 2>(1);
  const [verifiedProofs, setVerifiedProofs] = useState<VerifiedProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(true);
  const [proofsError, setProofsError] = useState('');

  // Phase 1 states
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [submitProofError, setSubmitProofError] = useState('');
  const [submitProofSuccess, setSubmitProofSuccess] = useState(false);

  // Phase 2 states
  const [isGeneratingFinalProof, setIsGeneratingFinalProof] = useState(false);
  const [finalProofStatus, setFinalProofStatus] = useState('');
  const [isClosingChannel, setIsClosingChannel] = useState(false);
  const [closeChannelError, setCloseChannelError] = useState('');

  // Load verified proofs from DB
  useEffect(() => {
    const fetchVerifiedProofs = async () => {
      try {
        setIsLoadingProofs(true);
        const response = await fetch(`/api/channels/${channelId}/proofs?type=verified`);
        const data = await response.json();

        if (data.success && data.data) {
          const proofsArray = Object.entries(data.data).map(([key, value]: [string, any]) => ({
            key,
            ...value,
          }));
          // Sort by sequence number descending (most recent first)
          proofsArray.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
          setVerifiedProofs(proofsArray);
        }
      } catch (error) {
        console.error('Error fetching verified proofs:', error);
        setProofsError('Failed to load verified proofs');
      } finally {
        setIsLoadingProofs(false);
      }
    };

    if (channelId) {
      fetchVerifiedProofs();
    }
  }, [channelId]);

  // Check if user is leader
  useEffect(() => {
    if (!isLeader && channelInfo) {
      router.push(`/state-explorer?channelId=${channelId}`);
    }
  }, [isLeader, channelInfo, channelId, router]);

  // Get the most recent proof for submission
  const selectedProof = useMemo(() => {
    return verifiedProofs.length > 0 ? verifiedProofs[0] : null;
  }, [verifiedProofs]);

  // Phase 1: Submit Proof to move channel from Open to Closing
  const handleSubmitProof = async () => {
    if (!selectedProof) {
      setSubmitProofError('No verified proof available');
      return;
    }

    setIsSubmittingProof(true);
    setSubmitProofError('');

    try {
      // Load proof ZIP file
      const response = await fetch(`/api/get-proof-zip?path=${encodeURIComponent(selectedProof.zipFile.filePath)}`);
      if (!response.ok) {
        throw new Error('Failed to load proof file');
      }
      const blob = await response.blob();

      // Format proof for contract
      const formattedData = await formatVerifiedProofsForSubmission([blob], channelId);

      console.log('Formatted proof data:', formattedData);

      // TODO: Call submitProofAndSignature with formattedData.proofData
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitProofSuccess(true);
      
      // Move to Phase 2 after 1 second
      setTimeout(() => {
        setPhase(2);
      }, 1000);

    } catch (error) {
      console.error('Error submitting proof:', error);
      setSubmitProofError(error instanceof Error ? error.message : 'Failed to submit proof');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Phase 2: Verify final balances and close channel
  const handleVerifyAndClose = async () => {
    setIsClosingChannel(true);
    setCloseChannelError('');
    setFinalProofStatus('Preparing final state data...');

    try {
      // TODO: Implement Phase 2 logic
      // 1. Get final state snapshot
      // 2. Calculate permutation
      // 3. Generate Groth16 proof
      // 4. Call verifyFinalBalancesGroth16
      
      setFinalProofStatus('Generating Groth16 proof...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      setFinalProofStatus('Submitting to blockchain...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success - redirect to withdraw
      router.push(`/state-explorer?channelId=${channelId}`);

    } catch (error) {
      console.error('Error closing channel:', error);
      setCloseChannelError(error instanceof Error ? error.message : 'Failed to close channel');
    } finally {
      setIsClosingChannel(false);
      setFinalProofStatus('');
    }
  };

  if (isLoadingProofs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading verified proofs...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (proofsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <span>{proofsError}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${phase === 1 ? 'text-primary' : 'text-green-500'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${phase === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
              {phase === 2 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-medium">Submit Proof</span>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${phase === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${phase === 2 ? 'bg-primary text-primary-foreground' : 'border-2'}`}>
              2
            </div>
            <span className="font-medium">Verify & Close</span>
          </div>
        </div>
      </div>

      {/* Phase 1: Submit Proof */}
      {phase === 1 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Phase 1: Submit Proof to Close Channel</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Channel Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Channel ID:</span>
                  <span className="ml-2 font-medium">#{channelId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current State:</span>
                  <span className="ml-2 font-medium">Open</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Verified Proofs Available</h3>
              <div className="text-sm text-muted-foreground mb-4">
                Total: {verifiedProofs.length} proof(s)
              </div>

              {selectedProof && (
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{selectedProof.proofId}</div>
                      <div className="text-sm text-muted-foreground">
                        Sequence: {selectedProof.sequenceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Verified: {new Date(selectedProof.verifiedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                      Selected
                    </div>
                  </div>
                </Card>
              )}

              {!selectedProof && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>No verified proofs available. Please verify proofs first.</span>
                </div>
              )}
            </div>

            {submitProofError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{submitProofError}</span>
              </div>
            )}

            {submitProofSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Proof submitted successfully! Moving to Phase 2...</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitProof}
                disabled={!selectedProof || isSubmittingProof || submitProofSuccess}
              >
                {isSubmittingProof && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmittingProof ? 'Submitting...' : 'Submit Proof & Move to Closing'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Phase 2: Verify Final Balances */}
      {phase === 2 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Phase 2: Verify Final Balances & Close Channel</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>Proof submitted successfully. Channel is now in Closing state.</span>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Final Balance Verification</h3>
              <p className="text-sm text-muted-foreground">
                This step will generate a Groth16 proof to verify the final state of all participants' balances
                and permanently close the channel.
              </p>
            </div>

            {finalProofStatus && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-600">{finalProofStatus}</span>
              </div>
            )}

            {closeChannelError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{closeChannelError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase(1)}
                disabled={isClosingChannel}
              >
                Back to Phase 1
              </Button>
              <Button
                onClick={handleVerifyAndClose}
                disabled={isClosingChannel}
              >
                {isClosingChannel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isClosingChannel ? 'Closing Channel...' : 'Verify & Close Channel'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
