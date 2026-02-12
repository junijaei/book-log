import { AuthContext } from '@/lib/auth/auth-context';
import type { AuthContextType } from '@/types/auth';
import { useContext } from 'react';

/**
 * Hook to access auth context.
 *
 * @returns Auth context value
 * @throws If used outside of AuthProvider
 *
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
