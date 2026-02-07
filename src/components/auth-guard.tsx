/**
 * Auth Guard Component
 *
 * Protects routes from unauthorized access.
 */

import { useAuth } from '@/hooks/use-auth';
import { MESSAGES } from '@/lib/constants';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Auth guard that redirects unauthenticated users to login.
 *
 * Preserves the attempted URL for redirect after login.
 *
 * @example
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{MESSAGES.LOADING}</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
