import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GUIDED_STEPS = [
  'connect',
  'assess',
  'pick',
  'concerns',
  'agent',
  'export',
] as const;
export type GuidedStep = (typeof GUIDED_STEPS)[number];

type State = {
  open: boolean;
  step: GuidedStep;
  /** Whether the user has dismissed/completed the workflow at least once.
   * Persisted to localStorage so it shows once per browser by default. */
  seen: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  goto: (step: GuidedStep) => void;
  dismiss: () => void;
};

export const useGuidedStore = create<State>()(
  persist(
    (set, get) => ({
      open: false,
      step: 'connect',
      seen: false,
      start: () => set({ open: true, step: 'connect' }),
      next: () => {
        const i = GUIDED_STEPS.indexOf(get().step);
        const nextStep = GUIDED_STEPS[i + 1];
        if (nextStep) set({ step: nextStep });
        else set({ open: false, seen: true });
      },
      prev: () => {
        const i = GUIDED_STEPS.indexOf(get().step);
        const prevStep = GUIDED_STEPS[i - 1];
        if (prevStep) set({ step: prevStep });
      },
      goto: (step) => set({ step, open: true }),
      dismiss: () => set({ open: false, seen: true }),
    }),
    {
      name: 'vento-guided-workflow',
      // Persist only `seen`; the open/step state is per-session.
      partialize: (s) => ({ seen: s.seen }),
    },
  ),
);
