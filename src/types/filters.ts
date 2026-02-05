/**
 * Filter, Sort, and Pagination Types
 *
 * Types for list operations with filtering, sorting, and pagination.
 */

import type { ReadingStatus } from './entities';

/** Filter options for reading records list */
export interface ReadingRecordFilters {
  /** Filter by reading status */
  status?: ReadingStatus[];
  /** Filter by start date (from) */
  start_date_from?: string;
  /** Filter by start date (to) */
  start_date_to?: string;
  /** Filter by end date (from) */
  end_date_from?: string;
  /** Filter by end date (to) */
  end_date_to?: string;
  /** Search by title/author */
  search?: string;
  /** Filter by specific reading log ID */
  reading_log_id?: string;
}

/** Available sort fields */
export type ReadingRecordSortField = 'updated_at' | 'start_date' | 'end_date' | 'created_at';

/** Sort configuration */
export interface ReadingRecordSort {
  field: ReadingRecordSortField;
  direction: 'asc' | 'desc';
}

/** Pagination parameters */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}
