/**
 * Entity Types — re-exported from @book-log/database (SSOT)
 *
 * All entity types are derived from the auto-generated Database Row types.
 * The actual definitions live in packages/database/entities.ts.
 */

export type {
  // DB enum aliases
  ReadingStatus,
  Visibility,
  FriendshipStatus,

  // App-level enums
  FeedScope,
  FriendAction,
  ReadingRecordSortField,
  SortDirection,

  // Row-derived entities
  Book,
  ReadingLog,
  Quote,
  Review,
  Profile,
  Friendship,

  // Projection types
  UserProfile,
  ProfileInfo,
  PublicProfile,

  // Composite types
  ReadingRecord,

  // Friend list response types
  FriendListItem,
  ReceivedRequestItem,
  SentRequestItem,

  // Shared utility types
  ValidationResult,
  UpdateProfilePayload,
} from '@book-log/database';
