/**
 * API Error Types
 */

import type { EdgeFunctionErrorResponse } from '@/types';

export type { EdgeFunctionErrorResponse };

/**
 * Custom error class for API errors with additional context.
 */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
