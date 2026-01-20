/**
 * Deposit Store (Step 2)
 * 
 * Manages deposit state for a specific channel
 */

import { create } from 'zustand';

export interface DepositInfo {
  amount: bigint;
  mptKey: string;
  completed: boolean;
  txHash?: string;
}

export interface DepositState {
  // Channel ID (required)
  channelId: bigint | null;
  
  // Deposits per participant
  deposits: Record<string, DepositInfo>;
  
  // Current user's deposit state
  currentUserDeposit: {
    amount: bigint | null;
    mptKey: string | null;
    needsApproval: boolean;
    isApproving: boolean;
    isDepositing: boolean;
    txHash: string | null;
    error: string | null;
  };
  
  // Actions
  setChannelId: (id: bigint | null) => void;
  setDeposit: (address: string, deposit: DepositInfo) => void;
  setCurrentUserDepositAmount: (amount: bigint | null) => void;
  setCurrentUserMPTKey: (key: string | null) => void;
  setNeedsApproval: (needs: boolean) => void;
  setApproving: (isApproving: boolean) => void;
  setDepositing: (isDepositing: boolean) => void;
  setDepositTxHash: (hash: string | null) => void;
  setDepositError: (error: string | null) => void;
  reset: () => void;
  
  // Computed
  areAllDepositsComplete: (participantAddresses: string[]) => boolean;
}

const initialState = {
  channelId: null as bigint | null,
  deposits: {} as Record<string, DepositInfo>,
  currentUserDeposit: {
    amount: null,
    mptKey: null,
    needsApproval: false,
    isApproving: false,
    isDepositing: false,
    txHash: null,
    error: null,
  },
};

export const useDepositStore = create<DepositState>()((set, get) => ({
  ...initialState,
  
  setChannelId: (id) => {
    const currentChannelId = get().channelId;
    // Clear MPT Key when channel changes
    if (currentChannelId !== id) {
      set({
        channelId: id,
        currentUserDeposit: {
          ...get().currentUserDeposit,
          mptKey: null, // Clear MPT Key when channel changes
        },
      });
    } else {
      set({ channelId: id });
    }
  },
  
  setDeposit: (address, deposit) => set((state) => ({
    deposits: {
      ...state.deposits,
      [address.toLowerCase()]: deposit,
    },
  })),
  
  setCurrentUserDepositAmount: (amount) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      amount,
    },
  })),
  
  setCurrentUserMPTKey: (key) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      mptKey: key,
    },
  })),
  
  setNeedsApproval: (needs) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      needsApproval: needs,
    },
  })),
  
  setApproving: (isApproving) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      isApproving,
    },
  })),
  
  setDepositing: (isDepositing) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      isDepositing,
    },
  })),
  
  setDepositTxHash: (hash) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      txHash: hash,
    },
  })),
  
  setDepositError: (error) => set((state) => ({
    currentUserDeposit: {
      ...state.currentUserDeposit,
      error,
    },
  })),
  
  reset: () => set(initialState),
  
  areAllDepositsComplete: (participantAddresses) => {
    const state = get();
    if (!state.channelId || participantAddresses.length === 0) return false;
    
    return participantAddresses.every((address) => {
      const deposit = state.deposits[address.toLowerCase()];
      return deposit?.completed === true;
    });
  },
}));

