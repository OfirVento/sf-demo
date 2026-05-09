import { create } from 'zustand';
import type { KbCapability } from '@/lib/kb/capabilities';

type State = {
  open: boolean;
  capability: KbCapability | null;
  show: (capability: KbCapability) => void;
  close: () => void;
};

export const useKbDrawerStore = create<State>((set) => ({
  open: false,
  capability: null,
  show: (capability) => set({ open: true, capability }),
  close: () => set({ open: false }),
}));
