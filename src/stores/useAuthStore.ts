import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { ProfileResponse } from '@/schemas/profile.schema';
import { authService } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';
import type { LoginInput, RegisterInput } from '@/schemas/auth.schema';

interface AuthState {
  session: Session | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (input) => {
    const data = await authService.signInWithEmail(input);
    set({ session: data.session, isLoading: false, isAuthenticated: true });
    await get().fetchProfile();
  },

  signUp: async (input) => {
    const data = await authService.signUpWithEmail(input);
    // Session may be null if email confirmation is required
    if (data.session) {
      set({ session: data.session, isLoading: false, isAuthenticated: true });
      await get().fetchProfile();
    }
  },

  signOut: async () => {
    await authService.signOut();
    // listener handles setSession(null) — no separate reset needed
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
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  },

  updateProfile: async (data) => {
    const { session } = get();
    if (!session?.user?.id) return;
    await profileService.updateProfile(session.user.id, data);
    await get().fetchProfile();
  },

  reset: () => {
    set({ session: null, profile: null, isLoading: false, isAuthenticated: false });
  },
}));
