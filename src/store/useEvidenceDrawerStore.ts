import { create } from 'zustand';
import type { EvidenceTrail } from '@/types/assessment';

type State = {
  open: boolean;
  title: string;
  trail: EvidenceTrail | null;
  show: (title: string, trail: EvidenceTrail) => void;
  close: () => void;
};

export const useEvidenceDrawerStore = create<State>((set) => ({
  open: false,
  title: '',
  trail: null,
  show: (title, trail) => set({ open: true, title, trail }),
  close: () => set({ open: false }),
}));
