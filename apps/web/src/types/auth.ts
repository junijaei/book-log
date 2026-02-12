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
  /** Sign out current user */
  signOut: () => Promise<void>;
}
