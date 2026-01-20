/**
 * Initialize Store (Step 3)
 * 
 * Manages initialization state for a specific channel
 */

import { create } from 'zustand';

export interface ProofData {
  pA: [bigint, bigint, bigint, bigint];
  pB: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  pC: [bigint, bigint, bigint, bigint];
  merkleRoot: string;
}

export interface InitializeState {
  // Channel ID (required)
  channelId: bigint | null;
  
  // Proof Generation
  isGeneratingProof: boolean;
  proofData: ProofData | null;
  proofError: string | null;
  
  // Initialize Transaction
  isInitializing: boolean;
  initializeTxHash: string | null;
  isConfirmingInitialize: boolean;
  initializeError: string | null;
  
  // Actions
  setChannelId: (id: bigint | null) => void;
  setGeneratingProof: (isGenerating: boolean) => void;
  setProofData: (proof: ProofData | null) => void;
  setProofError: (error: string | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  setInitializeTxHash: (hash: string | null) => void;
  setConfirmingInitialize: (isConfirming: boolean) => void;
  setInitializeError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  channelId: null as bigint | null,
  isGeneratingProof: false,
  proofData: null as ProofData | null,
  proofError: null,
  isInitializing: false,
  initializeTxHash: null,
  isConfirmingInitialize: false,
  initializeError: null,
};

export const useInitializeStore = create<InitializeState>()((set) => ({
  ...initialState,
  
  setChannelId: (id) => set({ channelId: id }),
  
  setGeneratingProof: (isGenerating) => set({ isGeneratingProof: isGenerating }),
  
  setProofData: (proof) => set({ proofData: proof }),
  
  setProofError: (error) => set({ proofError: error }),
  
  setInitializing: (isInitializing) => set({ isInitializing }),
  
  setInitializeTxHash: (hash) => set({ initializeTxHash: hash }),
  
  setConfirmingInitialize: (isConfirming) => set({ isConfirmingInitialize: isConfirming }),
  
  setInitializeError: (error) => set({ initializeError: error }),
  
  reset: () => set(initialState),
}));

