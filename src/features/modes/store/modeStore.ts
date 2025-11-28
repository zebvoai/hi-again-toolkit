import { create } from 'zustand';
import type { ModeState } from '../types';

export const useModeStore = create<ModeState>((set) => ({
  selectedMode: 'text',
  setMode: (mode) => set({ selectedMode: mode })
}));
