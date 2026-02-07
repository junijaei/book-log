import {
  VALID_STATUSES,
  VALID_SORT_FIELDS,
  VALID_SORT_DIRECTIONS,
  MAX_LIMIT,
  DEFAULT_LIMIT,
} from './constants.ts';
import type { ReadingRecordFilters, ReadingRecordSort, ValidationResult } from './types.ts';

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function isValidDateString(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return !isNaN(new Date(str).getTime());
}

export function escapeSearchTerm(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export function sanitizePagination(
  limit: unknown,
  offset: unknown,
  defaultLimit = DEFAULT_LIMIT
): { limit: number; offset: number } {
  let sanitizedLimit = defaultLimit;
  let sanitizedOffset = 0;

  if (typeof limit === 'number' && !isNaN(limit)) {
    sanitizedLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
  }

  if (typeof offset === 'number' && !isNaN(offset)) {
    sanitizedOffset = Math.max(Math.floor(offset), 0);
  }

  return { limit: sanitizedLimit, offset: sanitizedOffset };
}

export function validateFilters(filters: ReadingRecordFilters): ValidationResult {
  if (filters.status && filters.status.length > 0) {
    const invalidStatuses = filters.status.filter(
      (s) => !(VALID_STATUSES as readonly string[]).includes(s)
    );
    if (invalidStatuses.length > 0) {
      return {
        valid: false,
        error: `Invalid status values: ${invalidStatuses.join(', ')}. Valid values are: ${VALID_STATUSES.join(', ')}`,
      };
    }
  }

  const dateFields = [
    { key: 'start_date_from', value: filters.start_date_from },
    { key: 'start_date_to', value: filters.start_date_to },
    { key: 'end_date_from', value: filters.end_date_from },
    { key: 'end_date_to', value: filters.end_date_to },
  ];

  for (const { key, value } of dateFields) {
    if (value && !isValidDateString(value)) {
      return {
        valid: false,
        error: `Invalid date format for ${key}: "${value}". Use ISO 8601 format (e.g., 2024-01-15)`,
      };
    }
  }

  if (
    filters.start_date_from &&
    filters.start_date_to &&
    new Date(filters.start_date_from) > new Date(filters.start_date_to)
  ) {
    return { valid: false, error: 'start_date_from cannot be after start_date_to' };
  }

  if (
    filters.end_date_from &&
    filters.end_date_to &&
    new Date(filters.end_date_from) > new Date(filters.end_date_to)
  ) {
    return { valid: false, error: 'end_date_from cannot be after end_date_to' };
  }

  if (filters.search !== undefined && filters.search.trim() === '') {
    return { valid: false, error: 'Search term cannot be empty' };
  }

  return { valid: true };
}

export function validateSort(sort: ReadingRecordSort): ValidationResult {
  if (!(VALID_SORT_FIELDS as readonly string[]).includes(sort.field)) {
    return {
      valid: false,
      error: `Invalid sort field: "${sort.field}". Valid fields are: ${VALID_SORT_FIELDS.join(', ')}`,
    };
  }

  if (!(VALID_SORT_DIRECTIONS as readonly string[]).includes(sort.direction)) {
    return {
      valid: false,
      error: `Invalid sort direction: "${sort.direction}". Valid values are: asc, desc`,
    };
  }

  return { valid: true };
}
