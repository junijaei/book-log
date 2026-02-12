/**
 * Authentication API
 *
 * Functions for user authentication and session management.
 */

import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ApiError } from './errors';

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
