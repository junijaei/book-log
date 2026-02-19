/**
 * Authentication API
 *
 * Functions for user authentication and session management.
 */

import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { ApiError } from './errors';

/**
 * Signs in (or signs up) a user via Magic Link.
 * Supabase sends a one-time login link to the provided email address.
 * New users are automatically registered.
 *
 * @param email - The user's email address
 * @param redirectTo - URL to redirect to after clicking the magic link (defaults to /auth/callback)
 * @throws {ApiError} If the request fails
 *
 * @example
 * await signInWithMagicLink('user@example.com');
 */
export async function signInWithMagicLink(email: string, redirectTo?: string): Promise<void> {
  try {
    const emailRedirectTo = redirectTo ?? `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo,
      },
    });

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : '매직 링크 전송에 실패했습니다');
  }
}

/**
 * Verifies an OTP token hash from a magic link callback (PKCE flow).
 * Call this on the /auth/callback page after the user clicks the magic link.
 *
 * @param tokenHash - The token_hash query parameter from the callback URL
 * @param type - The OTP type (defaults to 'email')
 * @returns The session if verification succeeds
 * @throws {ApiError} If verification fails
 */
export async function verifyOtpToken(
  tokenHash: string,
  type: 'email' | 'magiclink' = 'email'
): Promise<Session> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }

    if (!data.session) {
      throw new ApiError('인증 후 세션을 가져오지 못했습니다');
    }

    return data.session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : '매직 링크 인증에 실패했습니다');
  }
}

/**
 * Signs in a user with email and password.
 *
 * @param email - The user's email address
 * @param password - The user's password
 * @returns The session data if successful
 * @throws {ApiError} If authentication fails
 *
 * @example
 * const session = await signInWithPassword('user@example.com', 'password123');
 */
export async function signInWithPassword(email: string, password: string): Promise<Session> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }

    if (!data.session) {
      throw new ApiError('No session returned after sign in');
    }

    return data.session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to sign in');
  }
}

/**
 * Signs in a user via Google OAuth (PKCE flow).
 * Redirects to Google consent screen, then back to /auth/callback.
 *
 * @throws {ApiError} If the request fails
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Google 로그인에 실패했습니다');
  }
}

/**
 * Updates the current user's password.
 * Supabase가 비밀번호 설정 시 자동으로 app_metadata.providers에 'email'을 추가하므로
 * 별도 메타데이터 플래그 불필요.
 *
 * @param password - The new password (min 6 characters)
 * @throws {ApiError} If the update fails
 */
export async function updatePassword(password: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : '비밀번호 설정에 실패했습니다');
  }
}

/**
 * Signs out the current user and clears the session.
 *
 * @throws {ApiError} If sign out fails
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to sign out');
  }
}

/**
 * Gets the current session if one exists.
 *
 * @returns The current session or null if not authenticated
 * @throws {ApiError} If session retrieval fails
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new ApiError(error.message, error.status, error.code, error);
    }

    return data.session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to get session');
  }
}

/**
 * Gets the current JWT access token for API calls.
 *
 * @returns The JWT access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

/**
 * Callback type for auth state changes.
 */
export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

/**
 * Subscribes to authentication state changes.
 *
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function to stop listening
 *
 * @example
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') console.log('User signed in');
 * });
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => {
    data.subscription.unsubscribe();
  };
}

/**
 * Checks if the user is currently authenticated.
 *
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Gets the current user's ID if authenticated.
 *
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
