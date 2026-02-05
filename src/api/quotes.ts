/**
 * Quotes API
 *
 * API functions for quote CRUD operations via Edge Functions.
 */

import type { CreateQuoteInput, DeleteQuoteInput, Quote, UpdateQuoteInput } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

/**
 * Creates a new quote.
 *
 * @param input - Quote creation data
 * @returns The created quote entity
 * @throws {ApiError} If the request fails
 */
export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  try {
    return await invokeEdgeFunction<Quote>('create-quote', {
      method: 'POST',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create quote');
  }
}

/**
 * Updates an existing quote.
 *
 * @param input - Quote update data (must include id)
 * @returns The updated quote entity
 * @throws {ApiError} If the request fails
 */
export async function updateQuote(input: UpdateQuoteInput): Promise<Quote> {
  try {
    return await invokeEdgeFunction<Quote>('update-quote', {
      method: 'POST',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update quote');
  }
}

/**
 * Deletes a quote.
 *
 * @param input - Quote deletion data (must include id)
 * @returns The deleted quote entity
 * @throws {ApiError} If the request fails
 */
export async function deleteQuote(input: DeleteQuoteInput): Promise<Quote> {
  try {
    return await invokeEdgeFunction<Quote>('delete-quote', {
      method: 'POST',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete quote');
  }
}
