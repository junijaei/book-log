/**
 * Books API
 *
 * API functions for book operations.
 */

import type { CreateBookInput, CreateBookResponse } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

/**
 * Creates a new book with an empty reading log.
 *
 * @param input - Book creation data
 * @returns The created book ID and reading log ID
 */
export async function createBook(input: CreateBookInput): Promise<CreateBookResponse> {
  try {
    return await invokeEdgeFunction<CreateBookResponse>('create-book', {
      method: 'POST',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create book');
  }
}
