import { create } from 'zustand';
import { Call } from '../types';

interface CallState {
  activeCall: Call | null;
  callHistory: Call[];
  setActiveCall: (call: Call | null) => void;
  setCallHistory: (calls: Call[]) => void;
  addCallToHistory: (call: Call) => void;
  updateCallStatus: (status: Call['status']) => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  callHistory: [],
  setActiveCall: (call) => set({ activeCall: call }),
  setCallHistory: (calls) => set({ callHistory: calls }),
  addCallToHistory: (call) => set((state) => ({ callHistory: [call, ...state.callHistory] })),
  updateCallStatus: (status) => set((state) => ({
    activeCall: state.activeCall ? { ...state.activeCall, status } : null
  }))
}));
