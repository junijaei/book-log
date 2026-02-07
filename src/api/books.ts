/**
 * Books API
 *
 * API functions for book creation.
 * Endpoint: POST /functions/v1/reading-records
 */

import type { CreateBookInput, CreateBookResponse } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

export async function createBook(input: CreateBookInput): Promise<CreateBookResponse> {
  try {
    const response = await invokeEdgeFunction<{ data: CreateBookResponse }>('reading-records', {
      method: 'POST',
      body: input,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create book');
  }
}
