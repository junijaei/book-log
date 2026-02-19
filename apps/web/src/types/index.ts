/**
 * Type Exports
 *
 * Re-exports all types from categorized files.
 * Entity, filter, and database types originate from @book-log/database (SSOT)
 * and are re-exported through the local wrapper files for path consistency.
 */

// Entity types (from @book-log/database via ./entities)
export type {
  ReadingStatus,
  Visibility,
  FeedScope,
  Book,
  ReadingLog,
  UserProfile,
  Profile,
  Quote,
  Review,
  ReadingRecord,
  FriendshipStatus,
  FriendAction,
  ProfileInfo,
  FriendListItem,
  ReceivedRequestItem,
  SentRequestItem,
  PublicProfile,
  UpdateProfilePayload,
} from './entities';

// API types (FE-only request/response shapes)
export type {
  CreateBookInput,
  CreateBookResponse,
  CreateReadingLogInput,
  UpdateReadingLogInput,
  CreateQuoteInput,
  UpdateQuoteInput,
  DeleteReadingRecordInput,
  DeleteReadingRecordResponse,
  DeleteQuoteResponse,
  UpsertQuoteData,
  UpsertPayload,
  UpsertReadingRecordResponse,
  FriendRequestBody,
  FriendRequestResponse,
  FriendAutoAcceptResponse,
  FriendAcceptResponse,
  FriendRejectResponse,
  FriendDeleteResponse,
  FriendBlockResponse,
  FriendUnblockResponse,
  EdgeFunctionErrorResponse,
  CreateReviewInput,
  UpdateReviewInput,
  DeleteReviewResponse,
  UpsertReviewData,
  AladinBook,
  BookSearchResponse,
} from './api';

// Filter/sort/pagination types (from @book-log/database via ./filters)
export type {
  ReadingRecordFilters,
  ReadingRecordSortField,
  ReadingRecordSort,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
} from './filters';

// Form types (FE-only)
export type {
  BookFormData,
  ReadingLogFormData,
  BookEditFormData,
  LocalQuote,
  NewQuoteFormData,
} from './forms';

// Database types (from @book-log/database via ./database)
export type { Database, Tables, InsertTables, UpdateTables } from './database';
