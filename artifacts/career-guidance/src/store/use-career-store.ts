import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentProfile, UserInfo } from '@workspace/api-client-react';

interface CareerStore {
  profile: StudentProfile | null;
  user: UserInfo | null;
  setProfile: (profile: StudentProfile) => void;
  clearProfile: () => void;
  setUser: (user: UserInfo | null) => void;
}

export const useCareerStore = create<CareerStore>()(
  persist(
    (set) => ({
      profile: null,
      user: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'career-guidance-storage',
    }
  )
);
