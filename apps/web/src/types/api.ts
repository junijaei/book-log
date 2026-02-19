/**
 * API Types
 *
 * Request/response types for API operations.
 */

import type {
  Book,
  FriendAction,
  ReadingLog,
  ReadingStatus,
  TablesInsert,
  TablesUpdate,
  Visibility,
} from '@book-log/database';

// =============================================================================
// Book API Types
// =============================================================================

/** Input for creating a new book */
export type CreateBookInput = Pick<
  TablesInsert<'books'>,
  'title' | 'author' | 'cover_image_url' | 'total_pages'
>;

/** Response from POST /reading-records (book created with empty reading log) */
export interface CreateBookResponse {
  book: Book;
  reading_log: ReadingLog;
}

// =============================================================================
// Reading Log API Types
// =============================================================================

/** Input for creating a reading log */
export type CreateReadingLogInput = Pick<
  TablesInsert<'reading_logs'>,
  'book_id' | 'status' | 'current_page' | 'rating' | 'start_date' | 'end_date' | 'review'
>;

/** Input for updating a reading log */
export type UpdateReadingLogInput = Pick<
  TablesUpdate<'reading_logs'>,
  'status' | 'current_page' | 'rating' | 'start_date' | 'end_date' | 'review'
>;

// =============================================================================
// Quote API Types
// =============================================================================

/** Input for creating a quote */
export type CreateQuoteInput = Pick<
  TablesInsert<'quotes'>,
  'reading_log_id' | 'text' | 'page_number' | 'noted_at'
>;

/** Input for updating a quote (includes id) */
export type UpdateQuoteInput = Pick<TablesUpdate<'quotes'>, 'text' | 'page_number' | 'noted_at'> & {
  id: string;
};

/** Input for deleting a reading record (ID passed as query param) */
export interface DeleteReadingRecordInput {
  reading_log_id: string;
}

/** Response from DELETE /reading-records */
export interface DeleteReadingRecordResponse {
  deleted: true;
  reading_log_id: string;
  book_id: string | null;
}

/** Response from DELETE /quotes */
export interface DeleteQuoteResponse {
  deleted: true;
  quote_id: string;
}

// =============================================================================
// Review API Types
// =============================================================================

/** Input for creating a review */
export type CreateReviewInput = Pick<
  TablesInsert<'reviews'>,
  'reading_log_id' | 'content' | 'page_number' | 'reviewed_at'
>;

/** Input for updating a review (includes id) */
export type UpdateReviewInput = Pick<
  TablesUpdate<'reviews'>,
  'content' | 'page_number' | 'reviewed_at'
> & { id: string };

/** Response from DELETE /reviews */
export interface DeleteReviewResponse {
  deleted: true;
  review_id: string;
}

// =============================================================================
// Upsert API Types
// =============================================================================

/** Quote data for upsert operation */
export type UpsertQuoteData = CreateQuoteInput & { id?: string };

/** Review data for upsert operation */
export type UpsertReviewData = CreateReviewInput & { id?: string };

/** Payload for PUT /reading-records */
export interface UpsertPayload {
  /** Book data - include id to update existing */
  book: CreateBookInput & { id?: string };
  /** Reading log data - include id to update existing */
  reading_log: UpdateReadingLogInput & {
    id?: string;
    visibility?: Visibility;
  };
  /** Quotes to create/update */
  quotes?: UpsertQuoteData[];
  /** Quote IDs to delete */
  delete_quote_ids?: string[];
  /** Reviews to create/update */
  reviews?: UpsertReviewData[];
  /** Review IDs to delete */
  delete_review_ids?: string[];
}

/** Response from PUT /reading-records */
export interface UpsertReadingRecordResponse {
  book_id: string;
  reading_log_id: string;
}

// =============================================================================
// Friends API Types
// =============================================================================

export interface FriendRequestBody {
  action: FriendAction;
  target_user_id?: string;
  friendship_id?: string;
  limit?: number;
  offset?: number;
}

export interface FriendRequestResponse {
  id: string;
  status: 'pending';
  created_at: string;
  addressee: { id: string; nickname: string; avatar_url: string | null };
}

export interface FriendAutoAcceptResponse {
  id: string;
  status: 'accepted';
  message: string;
  friend: { id: string; nickname: string; avatar_url: string | null };
}

export interface FriendAcceptResponse {
  id: string;
  status: 'accepted';
  friend: { id: string; nickname: string; avatar_url: string | null; bio: string | null };
}

export interface FriendRejectResponse {
  id: string;
  status: 'rejected';
}

export interface FriendDeleteResponse {
  id: string;
  deleted: true;
}

export interface FriendBlockResponse {
  id: string;
  status: 'blocked';
  created_at: string;
  message: string;
}

export interface FriendUnblockResponse {
  id: string;
  unblocked: true;
}

// =============================================================================
// Profile API Types — UpdateProfilePayload re-exported from @book-log/database
// =============================================================================

// =============================================================================
// Book Search (Aladin Open API) Types
// =============================================================================

export interface AladinBook {
  title: string;
  author: string;
  publisher: string;
  cover: string;
  isbn13: string;
  totalPages: number | null;
  pubDate: string;
  description: string;
  categoryName: string;
}

export interface BookSearchResponse {
  data: AladinBook[];
}

// =============================================================================
// Error Types
// =============================================================================

/** Error response from Edge Functions */
export interface EdgeFunctionErrorResponse {
  error?: string;
  message?: string;
  code?: string;
}
