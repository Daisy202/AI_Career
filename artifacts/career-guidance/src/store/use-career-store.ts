import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentProfile } from '@workspace/api-client-react';

interface CareerStore {
  profile: StudentProfile | null;
  setProfile: (profile: StudentProfile) => void;
  clearProfile: () => void;
}

export const useCareerStore = create<CareerStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'career-guidance-storage',
    }
  )
);
