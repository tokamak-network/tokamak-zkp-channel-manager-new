/**
 * Hook for submitting verified proofs to the contract
 * 
 * Automatically formats verified proofs from DB and submits them via submitProofAndSignature
 */

import { useState, useCallback } from 'react';
import { formatVerifiedProofsForSubmission, type FormattedProofForSubmission } from '../_utils/proofFormatter';

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

export function useSubmitProof(channelId: string) {
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedProofs, setFormattedProofs] = useState<FormattedProofForSubmission | null>(null);

  /**
   * Load verified proofs from DB and format them for submission
   */
  const loadAndFormatProofs = useCallback(async () => {
    setIsLoadingProofs(true);
    setError(null);

    try {
      // Fetch verified proofs from DB
      const response = await fetch(`/api/channels/${channelId}/proofs?type=verified`);
      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('No verified proofs available');
      }

      // Convert to array and sort by sequence number
      const proofsArray: VerifiedProof[] = Object.entries(data.data).map(([key, value]: [string, any]) => ({
        key,
        ...value,
      }));
      proofsArray.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      if (proofsArray.length === 0) {
        throw new Error('No verified proofs found');
      }

      // Load proof ZIP files
      const proofBlobs: Blob[] = [];
      for (const proof of proofsArray) {
        const zipResponse = await fetch(`/api/get-proof-zip?path=${encodeURIComponent(proof.zipFile.filePath)}`);
        if (!zipResponse.ok) {
          throw new Error(`Failed to load proof file: ${proof.proofId}`);
        }
        const blob = await zipResponse.blob();
        proofBlobs.push(blob);
      }

      // Format proofs for contract submission
      const formatted = await formatVerifiedProofsForSubmission(proofBlobs, channelId);
      setFormattedProofs(formatted);

      return formatted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load proofs';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoadingProofs(false);
    }
  }, [channelId]);

  /**
   * Submit proofs to the contract
   */
  const submitProofs = useCallback(async () => {
    if (!formattedProofs) {
      setError('No proofs loaded. Call loadAndFormatProofs first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement actual contract call to submitProofAndSignature
      // For now, just log the formatted data
      console.log('Submitting proofs:', {
        proofData: formattedProofs.proofData,
        finalStateRoot: formattedProofs.finalStateRoot,
        messageHash: formattedProofs.messageHash,
      });

      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        finalStateRoot: formattedProofs.finalStateRoot,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit proofs';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formattedProofs]);

  /**
   * Load and submit proofs in one call
   */
  const loadAndSubmit = useCallback(async () => {
    const formatted = await loadAndFormatProofs();
    
    // After loading, submit immediately
    setFormattedProofs(formatted);
    
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement actual contract call
      console.log('Submitting proofs:', {
        proofData: formatted.proofData,
        finalStateRoot: formatted.finalStateRoot,
        messageHash: formatted.messageHash,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        finalStateRoot: formatted.finalStateRoot,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit proofs';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadAndFormatProofs]);

  return {
    loadAndFormatProofs,
    submitProofs,
    loadAndSubmit,
    isLoadingProofs,
    isSubmitting,
    error,
    formattedProofs,
  };
}
