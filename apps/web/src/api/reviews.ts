/**
 * Reviews API
 *
 * API functions for review CRUD operations via Edge Functions.
 * Endpoint: /functions/v1/reviews
 */

import type { CreateReviewInput, DeleteReviewResponse, Review, UpdateReviewInput } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

const ENDPOINT = 'reviews';

export async function getReviews(readingLogId: string): Promise<Review[]> {
  try {
    const response = await invokeEdgeFunction<{ data: Review[] }>(ENDPOINT, {
      method: 'GET',
      query: { reading_log_id: readingLogId },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch reviews');
  }
}

export async function getReview(id: string): Promise<Review> {
  try {
    const response = await invokeEdgeFunction<{ data: Review }>(ENDPOINT, {
      method: 'GET',
      query: { id },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch review');
  }
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  try {
    const response = await invokeEdgeFunction<{ data: Review }>(ENDPOINT, {
      method: 'POST',
      body: input,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create review');
  }
}

export async function updateReview(input: UpdateReviewInput): Promise<Review> {
  try {
    const response = await invokeEdgeFunction<{ data: Review }>(ENDPOINT, {
      method: 'PUT',
      body: input,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update review');
  }
}

export async function deleteReview(id: string): Promise<DeleteReviewResponse> {
  try {
    const response = await invokeEdgeFunction<{ data: DeleteReviewResponse }>(ENDPOINT, {
      method: 'DELETE',
      query: { id },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete review');
  }
}
