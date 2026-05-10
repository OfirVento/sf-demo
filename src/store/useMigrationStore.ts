import { create } from 'zustand';
import type { CodeArtifact, SourceType } from '@/types/assessment';

export type GenerationState = 'not_started' | 'loading' | 'revealed';
export type ViewMode = 'three_pane' | 'diff';

type State = {
  selectedId: string | null;
  filter: SourceType | 'All';
  sort: 'complexity' | 'usage' | 'confidence';
  generation: Record<string, GenerationState>;
  marked: Record<string, boolean>; // ids marked for review
  viewMode: ViewMode;
  bulkOpen: boolean;
  bulkProgress: { total: number; done: number } | null;

  select: (id: string | null) => void;
  setFilter: (filter: State['filter']) => void;
  setSort: (sort: State['sort']) => void;
  /** Trigger generation for an artifact: not_started → loading → revealed (1.5s). */
  generate: (id: string) => Promise<void>;
  /** Re-generate just retriggers the loading reveal. */
  regenerate: (id: string) => Promise<void>;
  markForReview: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  openBulk: () => void;
  closeBulk: () => void;
  startBulk: (artifacts: CodeArtifact[]) => Promise<void>;
};

const REVEAL_MS = 1500;
const BULK_PER_ITEM_MS = 600;

export const useMigrationStore = create<State>((set) => ({
  selectedId: null,
  filter: 'All',
  sort: 'complexity',
  generation: {},
  marked: {},
  viewMode: 'three_pane',
  bulkOpen: false,
  bulkProgress: null,

  select: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),

  generate: async (id) => {
    set((s) => ({ generation: { ...s.generation, [id]: 'loading' } }));
    await new Promise((r) => setTimeout(r, REVEAL_MS));
    set((s) => ({ generation: { ...s.generation, [id]: 'revealed' } }));
  },

  regenerate: async (id) => {
    set((s) => ({ generation: { ...s.generation, [id]: 'loading' } }));
    await new Promise((r) => setTimeout(r, REVEAL_MS));
    set((s) => ({ generation: { ...s.generation, [id]: 'revealed' } }));
  },

  markForReview: (id) =>
    set((s) => ({ marked: { ...s.marked, [id]: !s.marked[id] } })),

  setViewMode: (viewMode) => set({ viewMode }),

  openBulk: () => set({ bulkOpen: true }),
  closeBulk: () => set({ bulkOpen: false, bulkProgress: null }),

  startBulk: async (artifacts) => {
    set({ bulkProgress: { total: artifacts.length, done: 0 } });
    for (let i = 0; i < artifacts.length; i++) {
      const a = artifacts[i];
      set((s) => ({ generation: { ...s.generation, [a.id]: 'loading' } }));
      await new Promise((r) => setTimeout(r, BULK_PER_ITEM_MS));
      set((s) => ({
        generation: { ...s.generation, [a.id]: 'revealed' },
        bulkProgress: { total: artifacts.length, done: i + 1 },
      }));
    }
    // Leave the modal open with the "complete" state so the user can dismiss.
  },
}));
