/**
 * Centralized Messages Index
 *
 * Aggregates all domain-specific message files into a single typed object.
 * This structure is future-ready for i18n without implementing it.
 *
 * Usage:
 *   import { messages } from '@/constants/messages';
 *   <h1>{messages.auth.login.title}</h1>
 */

import { authMessages } from './auth';
import { booksMessages } from './books';
import { commonMessages } from './common';
import { friendsMessages } from './friends';
import { profileMessages } from './profile';

export const messages = {
  auth: authMessages,
  books: booksMessages,
  common: commonMessages,
  friends: friendsMessages,
  profile: profileMessages,
} as const;

// Type helper for accessing nested message keys
export type Messages = typeof messages;

// Re-export individual domains for convenience (optional)
export { authMessages, booksMessages, commonMessages, friendsMessages, profileMessages };
