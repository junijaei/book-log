/**
 * Quotes API
 *
 * API functions for quote CRUD operations via Edge Functions.
 * Endpoint: /functions/v1/quotes
 */

import type { CreateQuoteInput, DeleteQuoteResponse, Quote, UpdateQuoteInput } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

const ENDPOINT = 'quotes';

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  try {
    const response = await invokeEdgeFunction<{ data: Quote }>(ENDPOINT, {
      method: 'POST',
      body: input,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create quote');
  }
}

export async function updateQuote(input: UpdateQuoteInput): Promise<Quote> {
  try {
    const response = await invokeEdgeFunction<{ data: Quote }>(ENDPOINT, {
      method: 'PUT',
      body: input,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update quote');
  }
}

export async function deleteQuote(id: string): Promise<DeleteQuoteResponse> {
  try {
    const response = await invokeEdgeFunction<{ data: DeleteQuoteResponse }>(ENDPOINT, {
      method: 'DELETE',
      query: { id },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete quote');
  }
}
