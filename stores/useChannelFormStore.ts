/**
 * Channel Form Store (Step 1)
 * 
 * Manages form data for creating a channel
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Participant {
  address: `0x${string}`;
}

export interface ChannelFormState {
  // Form Data
  channelName: string;
  targetContract: `0x${string}` | null;
  participants: Participant[];
  enableFrostSignature: boolean;
  
  // Actions
  setChannelName: (name: string) => void;
  setTargetContract: (contract: `0x${string}`) => void;
  addParticipant: (address: `0x${string}`) => void;
  removeParticipant: (index: number) => void;
  updateParticipant: (index: number, address: `0x${string}`) => void;
  setEnableFrostSignature: (enabled: boolean) => void;
  reset: () => void;
  
  // Validation
  isValid: () => boolean;
}

const initialState = {
  channelName: '',
  targetContract: null as `0x${string}` | null,
  participants: [] as Participant[],
  enableFrostSignature: true,
};

export const useChannelFormStore = create<ChannelFormState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setChannelName: (name) => set({ channelName: name }),
      
      setTargetContract: (contract) => set({ targetContract: contract }),
      
      addParticipant: (address) => set((state) => {
        if (state.participants.some(p => p.address.toLowerCase() === address.toLowerCase())) {
          return state;
        }
        return {
          participants: [...state.participants, { address }],
        };
      }),
      
      removeParticipant: (index) => set((state) => ({
        participants: state.participants.filter((_, i) => i !== index),
      })),
      
      updateParticipant: (index, address) => set((state) => {
        const newParticipants = [...state.participants];
        newParticipants[index] = { address };
        return { participants: newParticipants };
      }),
      
      setEnableFrostSignature: (enabled) => set({ enableFrostSignature: enabled }),
      
      reset: () => set(initialState),
      
      isValid: () => {
        const state = get();
        return (
          state.targetContract !== null &&
          state.participants.length >= 1 &&
          state.participants.every(p => /^0x[a-fA-F0-9]{40}$/.test(p.address))
        );
      },
    }),
    {
      name: 'channel-form-storage',
    }
  )
);

