import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  /** Current user, null if not authenticated */
  user: User | null;
  /** Current session, null if not authenticated */
  session: Session | null;
  /** Whether auth state is being loaded */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Send a magic link to the provided email address (passwordless sign-in / sign-up) */
  signInWithMagicLink: (email: string) => Promise<void>;
  /** Sign in with Google OAuth (redirects to Google consent screen) */
  signInWithGoogle: () => Promise<void>;
  /** Update the current user's password and mark has_password in metadata */
  updatePassword: (password: string) => Promise<void>;
  /** Sign out current user */
  signOut: () => Promise<void>;
}
