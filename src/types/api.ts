/**
 * API Types
 *
 * Request/response types for API operations.
 */

import type { Book, ReadingLog, ReadingStatus } from './entities';

// =============================================================================
// Book API Types
// =============================================================================

/** Input for creating a new book */
export interface CreateBookInput {
  title: string;
  author: string;
  cover_image_url?: string | null;
  total_pages?: number | null;
}

/** Response from POST /reading-records (book created with empty reading log) */
export interface CreateBookResponse {
  book: Book;
  reading_log: ReadingLog;
}

// =============================================================================
// Reading Log API Types
// =============================================================================

/** Input for creating a reading log */
export interface CreateReadingLogInput {
  book_id: string;
  status?: ReadingStatus;
  current_page?: number | null;
  rating?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  review?: string | null;
}

/** Input for updating a reading log */
export interface UpdateReadingLogInput {
  status?: ReadingStatus;
  current_page?: number | null;
  rating?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  review?: string | null;
}

// =============================================================================
// Quote API Types
// =============================================================================

/** Input for creating a quote */
export interface CreateQuoteInput {
  reading_log_id: string;
  text: string;
  page_number: number;
  noted_at?: string | null;
}

/** Input for updating a quote (includes id) */
export interface UpdateQuoteInput {
  id: string;
  text?: string;
  page_number?: number;
  noted_at?: string | null;
}

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
// Upsert API Types
// =============================================================================

/** Quote data for upsert operation */
export interface UpsertQuoteData {
  id?: string;
  text: string;
  page_number: number;
  noted_at?: string | null;
}

/** Payload for PUT /reading-records */
export interface UpsertPayload {
  /** Book data - include id to update existing */
  book: CreateBookInput & { id?: string };
  /** Reading log data - include id to update existing */
  reading_log: {
    id?: string;
    status?: ReadingStatus;
    current_page?: number | null;
    rating?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    review?: string | null;
  };
  /** Quotes to create/update */
  quotes?: UpsertQuoteData[];
  /** Quote IDs to delete */
  delete_quote_ids?: string[];
}

/** Response from PUT /reading-records */
export interface UpsertReadingRecordResponse {
  book_id: string;
  reading_log_id: string;
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
