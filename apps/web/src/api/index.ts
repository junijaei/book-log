/**
 * API Module Exports
 */

// Auth
export {
  signInWithPassword,
  signInWithMagicLink,
  verifyOtpToken,
  signOut,
  getSession,
  getAccessToken,
  onAuthStateChange,
  isAuthenticated,
  getCurrentUserId,
  type AuthStateChangeCallback,
} from './auth';

// Books
export { createBook, searchBooks, lookupBook } from './books';

// Reading Records
export {
  getReadingRecords,
  getReadingRecord,
  upsertReadingRecord,
  deleteReadingRecord,
} from './reading-records';

// Quotes
export { createQuote, updateQuote, deleteQuote } from './quotes';

// Reviews
export { createReview, updateReview, deleteReview } from './reviews';

// Profiles
export { getProfile, updateProfile, getPublicProfile, searchUsers } from './profiles';

// Friends
export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendship,
  blockUser,
  unblockUser,
  listFriends,
  listReceivedRequests,
  listSentRequests,
} from './friends';

// Errors
export { ApiError } from './errors';

// Edge Functions (advanced usage)
export { invokeEdgeFunction } from './edge-functions';
