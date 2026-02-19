/**
 * Supabase Client
 *
 * Centralized Supabase client initialization with type safety.
 */

import type { Database } from '@/types/database';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase project URL from environment variables.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Supabase anonymous/publishable key from environment variables.
 */
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Validate environment variables in development
if (import.meta.env.DEV && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn(
    '[Supabase] Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}

/**
 * Supabase client instance with full type safety.
 *
 * Configured with:
 * - Auto token refresh
 * - Persistent session storage
 * - Session detection from URL (for OAuth callbacks)
 * - PKCE flow for enhanced security
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      fetch: (...args) => {
        console.debug('FETCH:', args);
        return fetch(...args);
      },
    },
  }
);

// Edge Functions are invoked via supabase.functions.invoke()
// which automatically handles authentication
