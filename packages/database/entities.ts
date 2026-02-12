/**
 * Entity Types — Derived from Database Row Types (SSOT)
 *
 * All entity types extend or alias the auto-generated `Tables<T>` types from
 * `database.ts`. This guarantees frontend and backend share the exact same
 * column definitions without manual synchronisation.
 *
 * Pattern:
 *   type Foo = Tables<'foos'>                        — direct alias
 *   type Bar = Tables<'bars'> & { uiOnly?: boolean } — extension
 *   type Baz = Pick<Tables<'bazzes'>, 'id' | 'name'> — projection
 */

import type { Tables, Enums } from "./database";

// =============================================================================
// Enum Aliases — re-export DB enums as simple type aliases
// =============================================================================

/** Reading status enum values */
export type ReadingStatus = Enums<"reading_status">;

/** Visibility level for reading logs */
export type Visibility = Enums<"visibility">;

/** Friendship status values */
export type FriendshipStatus = Enums<"friendship_status">;

// =============================================================================
// App-Level Enums — not stored in DB, used in query parameters / request bodies
// =============================================================================

/** Feed scope for listing reading records */
export type FeedScope = "me" | "friends" | "all";

/** Available sort fields for reading record lists */
export type ReadingRecordSortField =
  | "updated_at"
  | "start_date"
  | "end_date"
  | "created_at";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Friend action discriminator for the friends Edge Function */
export type FriendAction =
  | "request"
  | "accept"
  | "reject"
  | "delete"
  | "block"
  | "unblock"
  | "list"
  | "received"
  | "sent";

// =============================================================================
// Row-Derived Entity Types
// =============================================================================

/** Book entity — direct alias of DB row */
export type Book = Tables<"books">;

/** Reading log entity — direct alias of DB row */
export type ReadingLog = Tables<"reading_logs">;

/** Quote entity — direct alias of DB row */
export type Quote = Tables<"quotes">;

/** Review entity — direct alias of DB row */
export type Review = Tables<"reviews">;

/** Full user profile entity — direct alias of DB row */
export type Profile = Tables<"profiles">;

/** Friendship entity — direct alias of DB row */
export type Friendship = Tables<"friendships">;

// =============================================================================
// Projection Types — subsets of full rows for API responses
// =============================================================================

/** User profile summary (embedded in ReadingRecord responses) */
export type UserProfile = Pick<Profile, "nickname" | "avatar_url">;

/** Profile info (public-facing subset with bio) */
export type ProfileInfo = Pick<
  Profile,
  "id" | "nickname" | "avatar_url" | "bio"
>;

/** Public profile — same shape as ProfileInfo */
export type PublicProfile = ProfileInfo;

// =============================================================================
// Composite Types — aggregated response shapes shared by FE & BE
// =============================================================================

/** Composite reading record (book + log + quotes + reviews + profile) */
export interface ReadingRecord {
  book: Book;
  reading_log: ReadingLog;
  quotes: Quote[];
  reviews: Review[];
  profile: UserProfile | null;
}

// =============================================================================
// Query / Filter Types — shared between FE filter UI and BE validation
// =============================================================================

/** Filter options for reading records list */
export interface ReadingRecordFilters {
  status?: ReadingStatus[];
  scope?: FeedScope;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  search?: string;
}

/** Sort configuration for reading records */
export interface ReadingRecordSort {
  field: ReadingRecordSortField;
  direction: SortDirection;
}

/** Pagination parameters (offset-based) */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Pagination metadata returned by list endpoints */
export interface PaginationMeta {
  limit: number;
  offset: number;
  count: number;
  total: number;
  scope?: FeedScope;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// =============================================================================
// Shared Utility Types
// =============================================================================

/** Validation result used by both FE and BE validators */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Profile update payload (partial update) */
export interface UpdateProfilePayload {
  nickname?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

// =============================================================================
// Friend List Response Types — shared between FE and BE
// =============================================================================

export interface FriendListItem {
  friendship_id: string;
  friend: ProfileInfo;
  since: string;
}

export interface ReceivedRequestItem {
  friendship_id: string;
  requester: ProfileInfo;
  requested_at: string;
}

export interface SentRequestItem {
  friendship_id: string;
  addressee: ProfileInfo;
  requested_at: string;
}
