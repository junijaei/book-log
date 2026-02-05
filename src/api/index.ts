/**
 * API Module Exports
 */

// Auth
export {
  signInWithPassword,
  signOut,
  getSession,
  getAccessToken,
  onAuthStateChange,
  isAuthenticated,
  getCurrentUserId,
  type AuthStateChangeCallback,
} from './auth';

// Books
export { createBook } from './books';

// Reading Records
export {
  getReadingRecords,
  getReadingRecord,
  upsertReadingRecord,
  deleteReadingRecord,
} from './reading-records';

// Quotes
export { createQuote, updateQuote, deleteQuote } from './quotes';

// Errors
export { ApiError } from './errors';

// Edge Functions (advanced usage)
export { invokeEdgeFunction } from './edge-functions';
