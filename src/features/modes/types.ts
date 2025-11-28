import type { Mode } from '@/types';

export interface ModeState {
  selectedMode: Mode;
  setMode: (mode: Mode) => void;
}
