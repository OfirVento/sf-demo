import { create } from 'zustand';

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type State = {
  open: boolean;
  messages: AgentMessage[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  reset: () => void;
};

export const useAgentStore = create<State>((set, get) => ({
  open: false,
  messages: [],
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
  reset: () => set({ messages: [] }),
}));
