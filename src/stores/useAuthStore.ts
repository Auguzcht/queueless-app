import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import type { ProfileResponse } from '@/schemas/profile.schema';
import { authService } from '@/services/auth.service';
import { profileService, type StudentProfileInfo, type GuardianInfo } from '@/services/profile.service';
import type { LoginInput, RegisterInput } from '@/schemas/auth.schema';

interface AuthState {
  session: Session | null;
  profile: ProfileResponse | null;
  studentProfile: StudentProfileInfo | null;
  guardianInfo: GuardianInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshExtendedProfile: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      studentProfile: null,
      guardianInfo: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (input) => {
        const data = await authService.signInWithEmail(input);
        set({ session: data.session, isLoading: false, isAuthenticated: true });
        await get().fetchProfile();
      },

      signUp: async (input) => {
        const data = await authService.signUpWithEmail(input);
        if (data.session) {
          set({ session: data.session, isLoading: false, isAuthenticated: true });
          await get().fetchProfile();
        }
      },

      signOut: async () => {
        await authService.signOut();
      },

      setSession: (session) => {
        set({ session, isAuthenticated: !!session, isLoading: false });
        if (session?.user) {
          get().fetchProfile();
        }
      },

      fetchProfile: async () => {
        const { session } = get();
        if (!session?.user?.id) return;
        try {
          const profile = await profileService.getProfile(session.user.id);
          set({ profile });
          get().refreshExtendedProfile();
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      },

      refreshExtendedProfile: async () => {
        const { profile } = get();
        if (!profile?.id) return;
        try {
          if (profile.role === 'student') {
            const info = await profileService.getStudentProfile(profile.id);
            set({ studentProfile: info });
          } else if (profile.role === 'parent') {
            const info = await profileService.getGuardianInfo(profile.id);
            set({ guardianInfo: info });
          }
        } catch (err) {
          console.error('Failed to fetch extended profile:', err);
        }
      },

      updateProfile: async (data) => {
        const { session } = get();
        if (!session?.user?.id) return;
        await profileService.updateProfile(session.user.id, data);
        await get().fetchProfile();
      },

      reset: () => {
        set({ session: null, profile: null, studentProfile: null, guardianInfo: null, isLoading: false, isAuthenticated: false });
      },
    }),
    {
      name: 'queueless-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        studentProfile: state.studentProfile,
        guardianInfo: state.guardianInfo,
      }),
    },
  ),
);
