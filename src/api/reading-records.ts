/**
 * Reading Records API
 *
 * API functions for reading record operations via Edge Functions.
 */

import type {
  DeleteReadingRecordInput,
  DeleteReadingRecordResponse,
  PaginatedResponse,
  PaginationParams,
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  UpsertPayload,
  UpsertReadingRecordResponse,
} from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

/**
 * Fetches reading records with optional filtering, sorting, and pagination.
 */
export async function getReadingRecords(
  filters?: ReadingRecordFilters,
  sort?: ReadingRecordSort,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ReadingRecord>> {
  const body: Record<string, unknown> = {};

  if (filters) body.filters = filters;
  if (sort) body.sort = sort;
  if (pagination) body.pagination = pagination;

  return await invokeEdgeFunction<PaginatedResponse<ReadingRecord>>('get-reading-records', {
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}

/**
 * Fetches a single reading record by reading log ID.
 */
export async function getReadingRecord(id: string): Promise<ReadingRecord | null> {
  const response = await invokeEdgeFunction<{data: ReadingRecord}>(
    'get-reading-record',
    {
      body: {
        filters: { reading_log_id: id },
        pagination: { limit: 1 },
      },
    }
  );

  return response.data ? response.data : null;
}

/**
 * Creates or updates a reading record (book + reading log + quotes).
 */
export async function upsertReadingRecord(
  payload: UpsertPayload
): Promise<UpsertReadingRecordResponse> {
  try {
    return await invokeEdgeFunction<UpsertReadingRecordResponse>('upsert-reading-records', {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to upsert reading record');
  }
}

/**
 * Deletes a reading record and associated data.
 *
 * @param input - Deletion input containing reading_log_id
 * @returns Details of what was deleted
 * @throws {ApiError} If the request fails
 */
export async function deleteReadingRecord(
  input: DeleteReadingRecordInput
): Promise<DeleteReadingRecordResponse> {
  try {
    return await invokeEdgeFunction<DeleteReadingRecordResponse>('delete-reading-record', {
      method: 'POST',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete reading record');
  }
}
