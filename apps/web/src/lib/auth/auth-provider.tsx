/**
 * Auth Provider
 *
 * React context for managing authentication state throughout the app.
 */

import {
  signInWithPassword as apiSignIn,
  signInWithMagicLink as apiSignInWithMagicLink,
  signOut as apiSignOut,
  getSession,
  onAuthStateChange,
} from '@/api/auth';
import { queryClient } from '@/lib/query-client';
import type { AuthContextType } from '@/types/auth';
import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';

/**
 * Auth provider props.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider component.
 *
 * Wraps the app to provide authentication state and methods.
 *
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        // 로그아웃 시 이전 유저 캐시 전체 제거
        queryClient.clear();
      } else if (event === 'SIGNED_IN') {
        // 로그인 시 stale 데이터 강제 재조회 (유저 전환 대응)
        void queryClient.invalidateQueries();
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const newSession = await apiSignIn(email, password);
    setSession(newSession);
    setUser(newSession.user);
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    await apiSignInWithMagicLink(email);
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setSession(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signInWithMagicLink,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
