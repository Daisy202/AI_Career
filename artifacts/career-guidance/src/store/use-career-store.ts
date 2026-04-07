import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentProfile, UserInfo, RecommendationsResponse } from '@workspace/api-client-react';

interface CareerStore {
  profile: StudentProfile | null;
  user: UserInfo | null;
  recommendations: RecommendationsResponse | null;
  /** True after first GET /auth/me completes (success or 401). */
  authHydrated: boolean;
  setProfile: (profile: StudentProfile) => void;
  setRecommendations: (data: RecommendationsResponse | null) => void;
  clearProfile: () => void;
  clearRecommendations: () => void;
  setUser: (user: UserInfo | null) => void;
  setAuthHydrated: (v: boolean) => void;
}

export const useCareerStore = create<CareerStore>()(
  persist(
    (set) => ({
      profile: null,
      user: null,
      recommendations: null,
      authHydrated: false,
      setProfile: (profile) => set({ profile }),
      setRecommendations: (data) => set({ recommendations: data }),
      clearProfile: () => set({ profile: null, recommendations: null }),
      clearRecommendations: () => set({ recommendations: null }),
      setUser: (user) => set({ user }),
      setAuthHydrated: (v) => set({ authHydrated: v }),
    }),
    {
      name: 'career-guidance-storage',
      partialize: (state) =>
        state.user
          ? { user: state.user, profile: state.profile, recommendations: state.recommendations }
          : { user: null, profile: null, recommendations: null },
      // authHydrated is not persisted — always re-check session on load
    }
  )
);
