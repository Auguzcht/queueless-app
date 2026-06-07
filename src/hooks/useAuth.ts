import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // Check existing session on mount
    authService.getSession()
      .then((session) => {
        store.setSession(session);
      })
      .catch((err) => {
        console.warn('Auth session check failed (expected if Supabase not configured):', err.message);
        store.setSession(null);
      });

    // Listen for auth state changes
    const { data: listener } = authService.onAuthStateChange((session) => {
      store.setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return store;
}
