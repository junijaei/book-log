/**
 * @book-log/database — Shared Database Types
 *
 * Single source of truth for all database-related types across the monorepo.
 *
 * Usage:
 *   import type { Database, Book, ReadingLog } from '@book-log/database';
 *   import type { Tables, TablesInsert, TablesUpdate } from '@book-log/database';
 */

// Re-export the auto-generated Supabase types (Database interface + helpers)
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database";

export { Constants } from "./database";

// Re-export all entity types derived from the Database rows
export type {
  // Row-derived entities
  Book,
  // App-level enums (not in DB)
  FeedScope,
  FriendAction,
  // Friend list response types
  FriendListItem,
  Friendship,
  FriendshipStatus,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
  Profile,
  ProfileInfo,
  PublicProfile,
  Quote,
  ReadingLog,
  // Composite types
  ReadingRecord,

  // Query / filter types
  ReadingRecordFilters,
  ReadingRecordSort,
  ReadingRecordSortField,
  // DB enum aliases
  ReadingStatus,
  ReceivedRequestItem,
  Review,
  SentRequestItem,
  SortDirection,
  UpdateProfilePayload,
  // Projection types
  UserProfile,
  // Utility types
  ValidationResult,
  Visibility,
} from "./entities";
