/**
 * Channel Flow Store
 * 
 * Manages the overall flow state (step navigation, channel ID)
 * Lightweight store for coordinating between step-specific stores
 */

import { create } from 'zustand';

export type CreateChannelStep = 1 | 2 | 3;

export interface ChannelFlowState {
  // Flow State
  step: CreateChannelStep;
  channelId: bigint | null;
  
  // Step 1 Transaction State (temporary, cleared after completion)
  isCreatingChannel: boolean;
  createChannelTxHash: string | null;
  isConfirmingCreate: boolean;
  createChannelError: string | null;
  
  // Actions
  setStep: (step: CreateChannelStep) => void;
  setChannelId: (id: bigint | null) => void;
  setCreatingChannel: (isCreating: boolean) => void;
  setCreateChannelTxHash: (hash: string | null) => void;
  setConfirmingCreate: (isConfirming: boolean) => void;
  setCreateChannelError: (error: string | null) => void;
  reset: () => void;
  
  // Auto-advance step when channel is created
  onChannelCreated: (id: bigint) => void;
}

const initialState = {
  step: 1 as CreateChannelStep,
  channelId: null as bigint | null,
  isCreatingChannel: false,
  createChannelTxHash: null,
  isConfirmingCreate: false,
  createChannelError: null,
};

export const useChannelFlowStore = create<ChannelFlowState>()((set) => ({
  ...initialState,
  
  setStep: (step) => set({ step }),
  
  setChannelId: (id) => set({ channelId: id }),
  
  setCreatingChannel: (isCreating) => set({ isCreatingChannel: isCreating }),
  
  setCreateChannelTxHash: (hash) => set({ createChannelTxHash: hash }),
  
  setConfirmingCreate: (isConfirming) => set({ isConfirmingCreate: isConfirming }),
  
  setCreateChannelError: (error) => set({ createChannelError: error }),
  
  reset: () => set(initialState),
  
  onChannelCreated: (id) => {
    set({
      channelId: id,
      step: 2, // Auto-advance to deposit step
      isCreatingChannel: false,
      createChannelTxHash: null,
      isConfirmingCreate: false,
      createChannelError: null,
    });
  },
}));

