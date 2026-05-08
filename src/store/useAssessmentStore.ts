import { create } from 'zustand';
import type { AssessmentPayload } from '@/types/assessment';

type State = {
  payload: AssessmentPayload | null;
  setPayload: (payload: AssessmentPayload) => void;
};

export const useAssessmentStore = create<State>((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
}));
