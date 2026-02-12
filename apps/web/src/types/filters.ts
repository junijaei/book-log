/**
 * Filter, Sort, and Pagination Types
 *
 * Types for list operations with filtering, sorting, and pagination.
 */

import type { FeedScope, ReadingStatus } from './entities';

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
  /** Visibility scope */
  scope?: FeedScope;
}

/** Available sort fields */
export type ReadingRecordSortField = 'updated_at' | 'start_date' | 'end_date' | 'created_at';

/** Sort configuration */
export interface ReadingRecordSort {
  field: ReadingRecordSortField;
  direction: 'asc' | 'desc';
}

/** Pagination parameters (offset-based) */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Pagination metadata */
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
