import { create } from 'zustand';

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Set on assistant messages while their tokens are still streaming. */
  streaming?: boolean;
  /** Optional surfaced error string when a request failed. */
  error?: string;
};

type State = {
  open: boolean;
  messages: AgentMessage[];
  /** Active AbortController while a request streams; null otherwise. */
  controller: AbortController | null;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Append a new message and return its id. */
  append: (msg: Omit<AgentMessage, 'id'>) => string;
  /** Mutate a message in-place by id. */
  patch: (id: string, patch: Partial<AgentMessage>) => void;
  /** Drop the message and any after it. Used for re-roll. */
  truncateAfter: (id: string) => void;
  /** Drop the trailing message if it's an empty/errored assistant. Prevents
   * the next user send from posting `{role: 'assistant', content: ''}` to
   * the API (which 400s) after a mid-stream abort. */
  dropTrailingEmptyAssistant: () => void;
  setController: (c: AbortController | null) => void;
  abort: () => void;
  reset: () => void;
};

export const useAgentStore = create<State>((set, get) => ({
  open: false,
  messages: [],
  controller: null,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
  append: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ messages: [...s.messages, { ...msg, id }] }));
    return id;
  },
  patch: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  truncateAfter: (id) =>
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === id);
      if (idx === -1) return s;
      return { messages: s.messages.slice(0, idx) };
    }),
  dropTrailingEmptyAssistant: () =>
    set((s) => {
      const last = s.messages[s.messages.length - 1];
      if (!last || last.role !== 'assistant') return s;
      const isEmpty = !last.content || last.content.trim() === '';
      if (isEmpty || last.error) {
        return { messages: s.messages.slice(0, -1) };
      }
      return s;
    }),
  setController: (controller) => set({ controller }),
  abort: () => {
    const c = get().controller;
    if (c) c.abort();
    set({ controller: null });
  },
  reset: () => {
    const c = get().controller;
    if (c) c.abort();
    set({ messages: [], controller: null });
  },
}));
